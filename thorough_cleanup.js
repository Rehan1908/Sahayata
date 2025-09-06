require('dotenv').config({ path: './backend/.env' });
const { MongoClient, ServerApiVersion } = require('mongodb');

async function thoroughCleanup() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri, { 
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true } 
  });
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('sahayata');
    
    // List of collections to clean up
    const collectionsToClean = [
      'user_journeys',
      'user_progress', 
      'hidden_journeys',
      'journey_progress'
    ];
    
    console.log('\nCleaning up collections...');
    
    for (const collectionName of collectionsToClean) {
      try {
        const collection = db.collection(collectionName);
        const countBefore = await collection.countDocuments();
        console.log(`${collectionName}: ${countBefore} documents before cleanup`);
        
        if (countBefore > 0) {
          const result = await collection.deleteMany({});
          console.log(`${collectionName}: Deleted ${result.deletedCount} documents`);
        }
        
        const countAfter = await collection.countDocuments();
        console.log(`${collectionName}: ${countAfter} documents after cleanup`);
        
      } catch (error) {
        console.error(`Error cleaning ${collectionName}:`, error.message);
      }
    }
    
    console.log('\nCleanup completed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

thoroughCleanup().catch(console.error);
