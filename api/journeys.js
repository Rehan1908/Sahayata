import { getDb } from './_db.js';

export default async function handler(req, res){
  try{
    const db = await getDb();
    const plans = db.collection('journey_plans');
    const progress = db.collection('journey_progress');
    if(req.method === 'GET'){
      const data = await plans.find({}).toArray();
      return res.status(200).json({ ok:true, journeys: data });
    }
    if(req.method === 'POST'){
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const { sessionId, journeyKey, step } = body;
      if(!sessionId || !journeyKey) return res.status(400).json({ ok:false, error:'sessionId & journeyKey required' });
      await progress.updateOne({ sid:sessionId, journeyKey }, { $set: { sid:sessionId, journeyKey, step: step||0, updatedAt:new Date().toISOString() } }, { upsert:true });
      return res.status(200).json({ ok:true });
    }
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }catch(e){ res.status(500).json({ ok:false, error: e.message }); }
}
