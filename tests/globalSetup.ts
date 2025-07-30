import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function(): Promise<void> {
  console.log('🚀 Setting up test environment...');
  
  // Start in-memory MongoDB instance for testing
  const mongod = new MongoMemoryServer({
    instance: {
      port: 27017,
      dbName: 'second-brain-test'
    }
  });
  
  await mongod.start();
  const uri = mongod.getUri();
  
  // Store the URI for use in tests
  process.env.MONGO_URI = uri;
  process.env.MONGODB_URI = uri;
  
  // Store the instance for cleanup
  (global as any).__MONGOD__ = mongod;
  
  console.log('✅ Test environment setup complete');
  console.log(`📊 MongoDB Test URI: ${uri}`);
}
