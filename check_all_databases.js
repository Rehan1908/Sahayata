require('dotenv').config({ path: './backend/.env' });
const { MongoClient, ServerApiVersion } = require('mongodb');

async function checkAllDatabases() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('No MONGODB_URI found');
    return;
  }

  console.log('Connecting to MongoDB...');
  const client = new MongoClient(uri, { 
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true } 
  });
  
  try {
    await client.connect();
    console.log('Connected successfully');
    
    // List all databases
    const adminDb = client.db().admin();
    const dbList = await adminDb.listDatabases();
    
    console.log('\nAll databases:');
    for (const db of dbList.databases) {
      console.log(`- ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      
      // Check collections in each database
      const database = client.db(db.name);
      const collections = await database.listCollections().toArray();
      
      for (const col of collections) {
        const collection = database.collection(col.name);
        const count = await collection.countDocuments();
        console.log(`  - ${col.name}: ${count} documents`);
        
        // If it's a user-related collection, show some sample data
        if (col.name.includes('journey') || col.name.includes('user') || col.name.includes('progress') || col.name.includes('hidden')) {
          const sample = await collection.find().limit(3).toArray();
          if (sample.length > 0) {
            console.log(`    Sample data:`, sample.map(s => ({ _id: s._id, key: s.key, title: s.title, userId: s.userId })));
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkAllDatabases().catch(console.error);
