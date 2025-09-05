// Minimal Node server for Sahayata
// Now prefers direct MongoDB connection (MONGODB_URI). Falls back to Atlas Data API if MONGODB_URI is not set.
// Env (direct driver): MONGODB_URI, DATA_API_DATABASE (or MONGODB_DB), DATA_API_COLLECTION (or MONGODB_COLLECTION)
// Env (fallback Data API): DATA_API_ENDPOINT, DATA_API_KEY, DATA_API_DATABASE, DATA_API_COLLECTION

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
let MongoClient, ServerApiVersion; // lazy require when used

// Lightweight .env loader (no dependencies). Looks for ./backend/.env and ../.env.
// Only sets vars that are not already defined in process.env.
(function loadDotEnv(){
  try{
    const candidates = [
      path.join(__dirname, '.env'),
      path.join(__dirname, '..', '.env')
    ];
    for(const p of candidates){
      if(fs.existsSync(p)){
        const content = fs.readFileSync(p, 'utf8');
        content.split(/\r?\n/).forEach(line => {
          const trimmed = line.trim();
          if(!trimmed || trimmed.startsWith('#')) return;
          const eq = trimmed.indexOf('=');
          if(eq === -1) return;
          const key = trimmed.slice(0, eq).trim();
          let val = trimmed.slice(eq+1).trim();
          if((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))){
            val = val.slice(1, -1);
          }
          if(process.env[key] === undefined){
            process.env[key] = val;
          }
        });
        break; // stop at first .env found
      }
    }
  }catch{ /* ignore .env load errors silently */ }
})();

const PORT = process.env.PORT || 3000;

// --- Mongo driver setup (optional) ---
let mongoClient = null;
let mongoDb = null;
async function initMongo(){
  if(mongoDb) return mongoDb;
  const uri = process.env.MONGODB_URI;
  if(!uri) return null;
  if(!MongoClient){ ({ MongoClient, ServerApiVersion } = require('mongodb')); }
  mongoClient = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true } });
  await mongoClient.connect();
  const dbName = process.env.MONGODB_DB || process.env.DATA_API_DATABASE || 'sahayata';
  mongoDb = mongoClient.db(dbName);
  return mongoDb;
}

function json(res, code, payload){
  const body = JSON.stringify(payload);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(body);
}

function readBody(req){
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; if(data.length > 1e6) req.connection.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch(e){ reject(e); } });
    req.on('error', reject);
  });
}

function callDataAPI(path, payload){
  const endpoint = process.env.DATA_API_ENDPOINT; // e.g., https://data.mongodb-api.com/app/<app-id>/endpoint/data/v1/action/
  const apiKey = process.env.DATA_API_KEY;
  if(!endpoint || !apiKey) throw new Error('Missing DATA_API_ENDPOINT or DATA_API_KEY');

  const url = new URL(path, endpoint);
  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data || '{}')); } catch(e){ reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function handle(req, res){
  // CORS preflight
  if(req.method === 'OPTIONS') return json(res, 200, { ok: true });

  if(req.url === '/health'){
    const hasUri = Boolean(process.env.MONGODB_URI);
    try{
      const db = await initMongo();
      const name = process.env.MONGODB_COLLECTION || process.env.DATA_API_COLLECTION || 'notes';
      const count = db ? await db.collection(name).countDocuments() : null;
      return json(res, 200, { ok: true, direct: { enabled: hasUri, count } });
    }catch(e){ return json(res, 200, { ok:true, direct:{ enabled: hasUri, error: e.message } }); }
  }

  if(req.url === '/api/notes' && req.method === 'POST'){
    try{
      const body = await readBody(req);
      const { mood = 'unknown', note = '', createdAt = new Date().toISOString() } = body || {};
      const collection = process.env.MONGODB_COLLECTION || process.env.DATA_API_COLLECTION || 'notes';
      // Prefer direct driver
      const db = await initMongo();
      if(db){
        const r = await db.collection(collection).insertOne({ mood, note, createdAt });
        return json(res, 200, { ok: true, result: { insertedId: r.insertedId } });
      }
      // Fallback Data API
      const database = process.env.DATA_API_DATABASE;
      const dataSource = process.env.DATA_API_DATASOURCE || 'mongodb-atlas';
      const result = await callDataAPI('action/insertOne', { dataSource, database, collection, document: { mood, note, createdAt } });
      return json(res, 200, { ok: true, result });
    }catch(e){
      return json(res, 500, { ok: false, error: e.message });
    }
  }

  if(req.url.startsWith('/api/notes') && req.method === 'GET'){
    try{
      const collection = process.env.MONGODB_COLLECTION || process.env.DATA_API_COLLECTION || 'notes';
      const db = await initMongo();
      if(db){
        const docs = await db.collection(collection).find({}).sort({ createdAt:-1 }).limit(10).toArray();
        return json(res, 200, { ok:true, result: { documents: docs } });
      }
      const database = process.env.DATA_API_DATABASE;
      const dataSource = process.env.DATA_API_DATASOURCE || 'mongodb-atlas';
      const result = await callDataAPI('action/find', { dataSource, database, collection, sort: { createdAt: -1 }, limit: 10 });
      return json(res, 200, { ok: true, result });
    }catch(e){
      return json(res, 500, { ok: false, error: e.message });
    }
  }

  json(res, 404, { ok:false, error: 'Not found' });
}

http.createServer((req, res) => {
  handle(req, res);
}).listen(PORT, () => {
  console.log('Sahayata backend running on port', PORT);
});
