import { getDb } from './_db.js';

export default async function handler(req, res){
  try{
    const db = await getDb();
    const col = db.collection('samvad');
    if(req.method === 'GET'){
      const topic = (req.query && req.query.topic) || 'general';
      const docs = await col.find({ topic }).sort({ createdAt:-1 }).limit(50).toArray();
      return res.status(200).json({ ok:true, documents: docs });
    }
    if(req.method === 'POST'){
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const { sessionId, topic='general', text='' } = body;
      if(!sessionId || !text.trim()) return res.status(400).json({ ok:false, error:'sessionId and text required' });
      const doc = { sid: sessionId, topic, text: String(text).slice(0,2000), createdAt: new Date().toISOString() };
      const r = await col.insertOne(doc);
      return res.status(200).json({ ok:true, id: r.insertedId });
    }
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }catch(e){ res.status(500).json({ ok:false, error: e.message }); }
}
