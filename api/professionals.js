const { getDb } = require('./_db.js');

module.exports = async function handler(req, res){
  try{
    const db = await getDb();
    const col = db.collection('professionals');
    if(req.method === 'GET'){
      const list = await col.find({}).toArray();
      return res.status(200).json({ ok:true, professionals: list });
    }
    return res.status(405).json({ ok:false, error:'Method not allowed' });
  }catch(e){ res.status(500).json({ ok:false, error: e.message }); }
}
