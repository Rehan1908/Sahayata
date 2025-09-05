let cached = { client: null, db: null };

async function getDb(){
  if(cached.db) return cached.db;
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = process.env.MONGODB_URI;
  if(!uri) throw new Error('Missing MONGODB_URI');
  const client = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true } });
  await client.connect();
  cached.client = client;
  cached.db = client.db(process.env.MONGODB_DB || 'sahayata');
  return cached.db;
}

module.exports = { getDb };
