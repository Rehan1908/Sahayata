const { MongoClient } = require('mongodb');

async function cleanupDatabase() {
  // MongoDB connection
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('sahayata');
    
    // Delete all custom journeys
    const deleteCustomResult = await db.collection('user_journeys').deleteMany({});
    console.log(`Deleted ${deleteCustomResult.deletedCount} custom journeys`);
    
    // Delete all progress records
    const deleteProgressResult = await db.collection('user_progress').deleteMany({});
    console.log(`Deleted ${deleteProgressResult.deletedCount} progress records`);
    
    // Delete all hidden journey records
    const deleteHiddenResult = await db.collection('hidden_journeys').deleteMany({});
    console.log(`Deleted ${deleteHiddenResult.deletedCount} hidden journey records`);
    
    console.log('Database cleanup completed successfully!');
    console.log('All users will now see only the 4 core journeys');
    
  } catch (error) {
    console.error('Error cleaning up database:', error);
  } finally {
    await client.close();
  }
}

cleanupDatabase();
