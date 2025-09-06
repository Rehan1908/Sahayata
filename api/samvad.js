const { getDb } = require('./_db.js');

module.exports = async function handler(req, res){
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
      
      if(!sessionId || !text.trim()) {
        return res.status(400).json({ ok:false, error:'sessionId and text required' });
      }
      
      // Simple rate limiting: max 5 posts per 5 minutes
      const recent = await col.countDocuments({
        sid: sessionId,
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000).toISOString() }
      });
      
      if(recent >= 5) {
        return res.status(429).json({ ok:false, error:'Too many posts. Please wait 5 minutes before posting again.' });
      }
      
      // Check for duplicate content (same user, same text, within 5 minutes)
      const recentDuplicate = await col.findOne({
        sid: sessionId,
        text: String(text).trim(),
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000).toISOString() }
      });
      
      if(recentDuplicate) {
        return res.status(409).json({ ok:false, error:'Duplicate post detected. Please wait before posting the same message again.' });
      }
      
      const doc = { 
        sid: sessionId, 
        topic, 
        text: String(text).slice(0,2000).trim(), 
        createdAt: new Date().toISOString() 
      };
      const r = await col.insertOne(doc);
      return res.status(200).json({ ok:true, id: r.insertedId });
    }
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }catch(e){ 
    console.error('Samvad API error:', e);
    res.status(500).json({ ok:false, error: e.message }); 
  }
}
