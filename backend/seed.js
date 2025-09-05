// Seed sample data for journeys, tools, professionals
const { MongoClient } = require('mongodb');
require('dotenv').config?.();

async function main(){
  const uri = process.env.MONGODB_URI;
  if(!uri){ console.error('Set MONGODB_URI in env'); process.exit(1); }
  const dbName = process.env.MONGODB_DB || 'sahayata';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  await db.collection('abhyas_tools').updateOne({ key:'breathing' }, { $set: { key:'breathing', title:'2‑minute guided breathing', type:'exercise', minutes:2 } }, { upsert:true });
  await db.collection('abhyas_tools').updateOne({ key:'thought-diary' }, { $set: { key:'thought-diary', title:'Thought diary prompt', type:'journal', minutes:3 } }, { upsert:true });
  await db.collection('abhyas_tools').updateOne({ key:'mindful-study' }, { $set: { key:'mindful-study', title:'Mindful study (5 mins)', type:'exercise', minutes:5 } }, { upsert:true });
  await db.collection('journey_plans').updateOne({ key:'resilience-14' }, { $set: { key:'resilience-14', title:'14‑Day Resilience', steps:14 } }, { upsert:true });
  await db.collection('journey_plans').updateOne({ key:'mindfulness-30' }, { $set: { key:'mindfulness-30', title:'30‑Day Mindfulness', steps:30 } }, { upsert:true });
  await db.collection('professionals').updateOne({ name:'Dr. Ananya Rao' }, { $set: { name:'Dr. Ananya Rao', speciality:'Anxiety, student life', languages:['English','Hindi'], price:799, active:true } }, { upsert:true });
  await db.collection('professionals').updateOne({ name:'Rahul Mehta, M.Phil (Clinical)' }, { $set: { name:'Rahul Mehta, M.Phil (Clinical)', speciality:'Exam stress, placements', languages:['English','Hindi'], price:699, active:true } }, { upsert:true });
  console.log('Seeded.');
  await client.close();
}

main().catch(e=>{ console.error(e); process.exit(1); });
