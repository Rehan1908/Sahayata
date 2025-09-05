// Vercel Serverless Function: /api/notes
// Proxies to MongoDB Atlas Data API without external deps

async function callDataAPI(actionPath, payload){
  const endpoint = process.env.DATA_API_ENDPOINT; // e.g., https://data.mongodb-api.com/app/<app-id>/endpoint/data/v1/
  const apiKey = process.env.DATA_API_KEY;
  if(!endpoint || !apiKey){
    throw new Error('Missing DATA_API_ENDPOINT or DATA_API_KEY');
  }
  const url = new URL(actionPath, endpoint).toString();
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
    throw new Error(text || 'Data API error');
  }
  try{ return JSON.parse(text); } catch{ return { raw: text }; }
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
  return res.status(500).json({ ok:false, error: e.message });
  }
}
