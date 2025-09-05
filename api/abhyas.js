import { getDb } from './_db.js';

const DEFAULT_TOOLS = [
  { key:'breathing', title:'2‑minute guided breathing', type:'exercise', minutes:2 },
  { key:'thought-diary', title:'Thought diary prompt', type:'journal', minutes:3 },
  { key:'mindful-study', title:'Mindful study (5 mins)', type:'exercise', minutes:5 },
];

export default async function handler(req, res){
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
      const r = await doneCol.insertOne({ sid: sessionId, key, at: new Date().toISOString() });
      return res.status(200).json({ ok:true, id: r.insertedId });
    }
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }catch(e){ res.status(500).json({ ok:false, error: e.message }); }
}
