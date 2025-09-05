// Health check for both backends
export default async function handler(req, res){
  const out = {
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    hasDataApi: Boolean(process.env.DATA_API_ENDPOINT && process.env.DATA_API_KEY),
    direct: null,
    dataApi: null,
  };
  // Try direct
  try{
    if(process.env.MONGODB_URI){
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db(process.env.MONGODB_DB || process.env.DATA_API_DATABASE || 'sahayata');
      const name = process.env.DATA_API_COLLECTION || 'notes';
      const count = await db.collection(name).countDocuments();
      out.direct = { ok: true, count };
      await client.close();
    }
  }catch(e){ out.direct = { ok:false, error: e.message }; }

  // Try Data API
  try{
    const base = process.env.DATA_API_ENDPOINT;
    const key = process.env.DATA_API_KEY;
    if(base && key){
      const url = new URL('action/find', base).toString();
      const r = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json', 'api-key': key }, body: JSON.stringify({ dataSource: process.env.DATA_API_DATASOURCE||'mongodb-atlas', database: process.env.DATA_API_DATABASE||'sahayata', collection: process.env.DATA_API_COLLECTION||'notes', limit:0 })});
      const text = await r.text();
      try{ out.dataApi = { ok:r.ok, status:r.status, body: JSON.parse(text) }; }
      catch{ out.dataApi = { ok:r.ok, status:r.status, body: text.slice(0,300) }; }
      out.resolvedFindUrl = url;
    }
  }catch(e){ out.dataApi = { ok:false, error:e.message }; }

  res.status(200).json(out);
}
