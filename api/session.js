const { getDb } = require('./_db.js');

module.exports = async function handler(req, res){
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
  try{
    const { randomBytes } = require('crypto');
    return randomBytes(16).toString('hex');
  }catch{
    return String(Date.now()) + Math.random().toString(16).slice(2);
  }
}
