// Seed sample data for journeys, tools, professionals
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function main(){
  const uri = process.env.MONGODB_URI;
  if(!uri){ console.error('Set MONGODB_URI in env'); process.exit(1); }
  const dbName = process.env.MONGODB_DB || 'sahayata';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  // Abhyas tools - comprehensive toolkit
  await db.collection('abhyas_tools').updateOne({ key:'breathing' }, { $set: { key:'breathing', title:'Guided breathing meditation', type:'meditation', minutes:2, description:'Calm your racing mind with gentle breath awareness' } }, { upsert:true });
  await db.collection('abhyas_tools').updateOne({ key:'thought-diary' }, { $set: { key:'thought-diary', title:'Interactive thought diary', type:'journal', minutes:5, description:'Clear your head by writing down what\'s bothering you' } }, { upsert:true });
  await db.collection('abhyas_tools').updateOne({ key:'mindful-study' }, { $set: { key:'mindful-study', title:'Mindful studying technique', type:'guide', minutes:5, description:'Study with focus and less anxiety' } }, { upsert:true });
  await db.collection('abhyas_tools').updateOne({ key:'exam-anxiety' }, { $set: { key:'exam-anxiety', title:'Managing exam anxiety', type:'guide', minutes:7, description:'Practical steps to handle exam stress' } }, { upsert:true });
  await db.collection('abhyas_tools').updateOne({ key:'placement-stress' }, { $set: { key:'placement-stress', title:'Coping with placement pressure', type:'guide', minutes:6, description:'Navigate job search anxiety with confidence' } }, { upsert:true });
  await db.collection('abhyas_tools').updateOne({ key:'sleep-hygiene' }, { $set: { key:'sleep-hygiene', title:'Better sleep habits', type:'guide', minutes:4, description:'Step-by-step guide to quality rest' } }, { upsert:true });
  await db.collection('abhyas_tools').updateOne({ key:'time-management' }, { $set: { key:'time-management', title:'Time management for students', type:'guide', minutes:8, description:'Organize your day to reduce overwhelm' } }, { upsert:true });
  await db.collection('abhyas_tools').updateOne({ key:'gratitude-practice' }, { $set: { key:'gratitude-practice', title:'Daily gratitude exercise', type:'exercise', minutes:3, description:'Build positivity with simple appreciation' } }, { upsert:true });
  await db.collection('abhyas_tools').updateOne({ key:'hostel-loneliness' }, { $set: { key:'hostel-loneliness', title:'Dealing with hostel loneliness', type:'guide', minutes:6, description:'Connect with others and feel less isolated' } }, { upsert:true });
  await db.collection('abhyas_tools').updateOne({ key:'parental-pressure' }, { $set: { key:'parental-pressure', title:'Managing parental expectations', type:'guide', minutes:5, description:'Navigate family pressure with healthy boundaries' } }, { upsert:true });
  // Journey plans - gamified wellness programs
  await db.collection('journey_plans').updateOne({ key:'resilience-14' }, { $set: { key:'resilience-14', title:'14‑Day Resilience Challenge', steps:14, description:'Build mental strength day by day', points:140 } }, { upsert:true });
  await db.collection('journey_plans').updateOne({ key:'mindfulness-30' }, { $set: { key:'mindfulness-30', title:'30‑Day Mindfulness Habit', steps:30, description:'Develop awareness and calm', points:300 } }, { upsert:true });
  await db.collection('journey_plans').updateOne({ key:'study-smart-21' }, { $set: { key:'study-smart-21', title:'21‑Day Smart Study', steps:21, description:'Exam preparation without burnout', points:210 } }, { upsert:true });
  await db.collection('journey_plans').updateOne({ key:'sleep-better-10' }, { $set: { key:'sleep-better-10', title:'10‑Day Better Sleep', steps:10, description:'Improve rest and energy', points:100 } }, { upsert:true });
  await db.collection('journey_plans').updateOne({ key:'confidence-boost-7' }, { $set: { key:'confidence-boost-7', title:'7‑Day Confidence Boost', steps:7, description:'Build self-esteem for placements', points:70 } }, { upsert:true });
  // Professional therapists - vetted and specialized
  await db.collection('professionals').updateOne({ name:'Dr. Ananya Rao' }, { $set: { name:'Dr. Ananya Rao', speciality:'Anxiety, student life', languages:['English','Hindi'], price:799, active:true, experience:'8+ years', qualification:'M.D. Psychiatry' } }, { upsert:true });
  await db.collection('professionals').updateOne({ name:'Rahul Mehta, M.Phil (Clinical)' }, { $set: { name:'Rahul Mehta, M.Phil (Clinical)', speciality:'Exam stress, placements', languages:['English','Hindi'], price:699, active:true, experience:'5+ years', qualification:'M.Phil Clinical Psychology' } }, { upsert:true });
  await db.collection('professionals').updateOne({ name:'Dr. Priya Sharma' }, { $set: { name:'Dr. Priya Sharma', speciality:'Depression, hostel adjustment', languages:['English','Hindi','Tamil'], price:849, active:true, experience:'10+ years', qualification:'Ph.D. Clinical Psychology' } }, { upsert:true });
  await db.collection('professionals').updateOne({ name:'Arjun Singh, RCI Licensed' }, { $set: { name:'Arjun Singh, RCI Licensed', speciality:'Family pressure, career anxiety', languages:['English','Hindi','Punjabi'], price:649, active:true, experience:'6+ years', qualification:'M.A. Psychology, RCI Licensed' } }, { upsert:true });
  await db.collection('professionals').updateOne({ name:'Dr. Meera Gupta' }, { $set: { name:'Dr. Meera Gupta', speciality:'Trauma, crisis intervention', languages:['English','Hindi','Bengali'], price:899, active:true, experience:'12+ years', qualification:'M.D. Psychiatry, Trauma Specialist' } }, { upsert:true });
  console.log('Seeded.');
  await client.close();
}

main().catch(e=>{ console.error(e); process.exit(1); });
