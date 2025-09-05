// Vercel Serverless Function: /api/notes
// Supports two backends:
// 1) Direct MongoDB connection via MONGODB_URI (preferred now)
// 2) MongoDB Atlas Data API (fallback when MONGODB_URI not set)

let cachedDb = null;
let cachedClient = null;

async function getDirectDb(){
  const uri = process.env.MONGODB_URI;
  if(!uri) return null;
  if(cachedDb) return cachedDb;
  const { MongoClient, ServerApiVersion } = await import('mongodb');
  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
  });
  await client.connect();
  cachedClient = client;
  const dbName = process.env.MONGODB_DB || process.env.DATA_API_DATABASE || 'sahayata';
  cachedDb = client.db(dbName);
  return cachedDb;
}

async function callDataAPI(actionPath, payload){
  const endpoint = process.env.DATA_API_ENDPOINT; // e.g., https://data.mongodb-api.com/app/<app-id>/endpoint/data/v1/
  const apiKey = process.env.DATA_API_KEY;
  if(!endpoint || !apiKey){
    throw new Error('Missing DATA_API_ENDPOINT or DATA_API_KEY');
  }
  // Validate endpoint is the new Data API host (region-specific) and not the legacy HTTPS Endpoints
  const endpointOk = /data\.mongodb-api\.com\/app\/.+\/endpoint\/data\/v1\/?$/i.test(endpoint);
  if(!endpointOk){
    const hint = 'DATA_API_ENDPOINT must be like https://<region>.aws.data.mongodb-api.com/app/<AppID>/endpoint/data/v1/ (copy from App Services → Data API).';
    const err = new Error('Invalid DATA_API_ENDPOINT (likely using legacy HTTPS Endpoints). ' + hint);
    err.meta = { endpoint };
    throw err;
  }
  const url = new URL(actionPath, endpoint).toString();
  try{
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    if(!res.ok){
      const err = new Error(text || 'Data API error');
      err.meta = { url, status: res.status };
      throw err;
    }
    try{ return JSON.parse(text); } catch{ return { raw: text }; }
  }catch(e){
    // rethrow with url context
    if(!e.meta){ e.meta = { url, status: 0 }; }
    throw e;
  }
}

export default async function handler(req, res){
  // CORS not required on Vercel (same origin). Keep a basic preflight if needed.
  if(req.method === 'OPTIONS'){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json({ ok: true });
  }

  try{
    const database = process.env.DATA_API_DATABASE;
    const collection = process.env.DATA_API_COLLECTION || 'notes';
    const dataSource = process.env.DATA_API_DATASOURCE || 'mongodb-atlas';

    // Prefer direct driver if MONGODB_URI is provided
    const directDb = await getDirectDb();
    if(directDb){
      const col = directDb.collection(collection);
      if(req.method === 'POST'){
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        const { mood = 'unknown', note = '', createdAt = new Date().toISOString() } = body;
        const r = await col.insertOne({ mood, note, createdAt });
        return res.status(200).json({ ok: true, result: { insertedId: r.insertedId } });
      }
      if(req.method === 'GET'){
        const docs = await col.find({}).sort({ createdAt: -1 }).limit(10).toArray();
        return res.status(200).json({ ok: true, result: { documents: docs } });
      }
      return res.status(405).json({ ok:false, error: 'Method not allowed' });
    }

  if(req.method === 'POST'){
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const { mood = 'unknown', note = '', createdAt = new Date().toISOString() } = body;
      const result = await callDataAPI('action/insertOne', { dataSource, database, collection, document: { mood, note, createdAt } });
      return res.status(200).json({ ok: true, result });
    }

    if(req.method === 'GET'){
      const result = await callDataAPI('action/find', { dataSource, database, collection, sort: { createdAt: -1 }, limit: 10 });
      return res.status(200).json({ ok: true, result });
    }

    return res.status(405).json({ ok:false, error: 'Method not allowed' });
  }catch(e){
    const info = e && e.meta ? e.meta : {};
    return res.status(500).json({ ok:false, error: e.message, info });
  }
}
