export default async function handler(req, res){
  const out = {
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    db: process.env.MONGODB_DB || 'sahayata',
    collection: process.env.MONGODB_COLLECTION || process.env.DATA_API_COLLECTION || 'notes',
    direct: null
  };
  try{
    if(!process.env.MONGODB_URI) throw new Error('Missing MONGODB_URI');
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(out.db);
    const count = await db.collection(out.collection).countDocuments();
    out.direct = { ok: true, count };
    await client.close();
  }catch(e){ out.direct = { ok:false, error: e.message }; }
  res.status(200).json(out);
}
