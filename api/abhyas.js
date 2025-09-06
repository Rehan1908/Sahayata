const { getDb } = require('./_db.js');

const DEFAULT_TOOLS = [
  { key:'breathing', title:'Guided breathing meditation', type:'meditation', minutes:2, description:'Calm your racing mind with gentle breath awareness' },
  { key:'thought-diary', title:'Interactive thought diary', type:'journal', minutes:5, description:'Clear your head by writing down what\'s bothering you' },
  { key:'mindful-study', title:'Mindful studying technique', type:'guide', minutes:5, description:'Study with focus and less anxiety' },
  { key:'exam-anxiety', title:'Managing exam anxiety', type:'guide', minutes:7, description:'Practical steps to handle exam stress' },
  { key:'placement-stress', title:'Coping with placement pressure', type:'guide', minutes:6, description:'Navigate job search anxiety with confidence' },
  { key:'sleep-hygiene', title:'Better sleep habits', type:'guide', minutes:4, description:'Step-by-step guide to quality rest' },
  { key:'time-management', title:'Time management for students', type:'guide', minutes:8, description:'Organize your day to reduce overwhelm' },
  { key:'gratitude-practice', title:'Daily gratitude exercise', type:'exercise', minutes:3, description:'Build positivity with simple appreciation' },
  { key:'hostel-loneliness', title:'Dealing with hostel loneliness', type:'guide', minutes:6, description:'Connect with others and feel less isolated' },
  { key:'parental-pressure', title:'Managing parental expectations', type:'guide', minutes:5, description:'Navigate family pressure with healthy boundaries' }
];

module.exports = async function handler(req, res){
  try{
    const db = await getDb();
    const toolsCol = db.collection('abhyas_tools');
    const doneCol = db.collection('abhyas_done');
    if(req.method === 'GET'){
      const tools = await toolsCol.find({}).toArray();
      return res.status(200).json({ ok:true, tools: tools.length?tools:DEFAULT_TOOLS });
    }
    if(req.method === 'POST'){
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const { sessionId, key } = body;
      if(!sessionId || !key) return res.status(400).json({ ok:false, error:'sessionId and key required' });
      
      // Log the completion
      const r = await doneCol.insertOne({ sid: sessionId, key, at: new Date().toISOString() });
      
      // Update user progress (if progress API is available)
      try {
        const progressCol = db.collection('user_progress');
        const progress = await progressCol.findOne({ sid: sessionId }) || { sid: sessionId, totalPoints: 0, completedTools: [], activeJourneys: {}, badges: [], streakDays: 0 };
        if(!progress.completedTools.includes(key)) {
          progress.completedTools.push(key);
          progress.totalPoints += 10;
          await progressCol.replaceOne({ sid: sessionId }, progress, { upsert: true });
        }
      } catch(e) { /* progress tracking is optional */ }
      
      return res.status(200).json({ ok:true, id: r.insertedId });
    }
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }catch(e){ res.status(500).json({ ok:false, error: e.message }); }
}
