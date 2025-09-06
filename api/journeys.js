const { getDb } = require('./_db.js');

module.exports = async function handler(req, res){
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
      
      // Handle journey progress updates
      if(journeyKey && !body.title) {
        if(!sessionId || !journeyKey) return res.status(400).json({ ok:false, error:'sessionId & journeyKey required' });
        await progress.updateOne(
          { sid:sessionId, journeyKey }, 
          { $inc: { step: 1 }, $set: { sid:sessionId, journeyKey, updatedAt:new Date().toISOString() } }, 
          { upsert:true }
        );
        return res.status(200).json({ ok:true });
      }
      
      // Handle creating new journeys
      if(body.title) {
        const { key, title, description, steps, points, category, activities, custom } = body;
        if(!sessionId || !title) return res.status(400).json({ ok:false, error:'sessionId & title required' });
        
        const journey = {
          key: key || title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          title,
          description: description || '',
          steps: steps || 7,
          points: points || (steps * 20),
          category: category || 'general',
          activities: activities || [],
          custom: custom || false,
          createdBy: sessionId,
          createdAt: new Date().toISOString()
        };
        
        await plans.updateOne(
          { key: journey.key },
          { $set: journey },
          { upsert: true }
        );
        
        return res.status(200).json({ ok:true, journey });
      }
      
      return res.status(400).json({ ok:false, error:'Invalid request' });
    }
    
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }catch(e){ 
    console.error('Journeys API error:', e);
    res.status(500).json({ ok:false, error: e.message }); 
  }
}
