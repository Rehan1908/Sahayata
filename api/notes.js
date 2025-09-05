// Vercel Serverless Function: /api/notes
// Direct MongoDB only (MONGODB_URI)

let cachedDb = null;
let cachedClient = null;

async function getDb(){
  const uri = process.env.MONGODB_URI;
  if(!uri) throw new Error('Missing MONGODB_URI');
  if(cachedDb) return cachedDb;
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
  });
  await client.connect();
  cachedClient = client;
  const dbName = process.env.MONGODB_DB || 'sahayata';
  cachedDb = client.db(dbName);
  return cachedDb;
}

module.exports = async function handler(req, res){
  // CORS not required on Vercel (same origin). Keep a basic preflight if needed.
  if(req.method === 'OPTIONS'){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json({ ok: true });
  }

  try{
    const collection = process.env.MONGODB_COLLECTION || process.env.DATA_API_COLLECTION || 'notes';
    const db = await getDb();
    const col = db.collection(collection);
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
  }catch(e){
    return res.status(500).json({ ok:false, error: e.message });
  }
}
