import { getDb } from './_db.js';

export default async function handler(req, res){
  try{
    const db = await getDb();
    const sid = await cryptoRandom();
    await db.collection('sessions').updateOne({ sid }, { $setOnInsert: { sid, createdAt: new Date().toISOString() } }, { upsert: true });
    res.status(200).json({ ok:true, sessionId: sid });
  }catch(e){ res.status(500).json({ ok:false, error: e.message }); }
}

async function cryptoRandom(){
  // 16 bytes hex
  if(typeof crypto !== 'undefined' && crypto.randomUUID){
    return crypto.randomUUID().replace(/-/g,'');
  }
  if(typeof crypto !== 'undefined' && crypto.getRandomValues){
    const a = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(a).map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  // fallback dynamic import for Node
  const { randomBytes } = await import('node:crypto');
  return randomBytes(16).toString('hex');
}
