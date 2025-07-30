export default async function(): Promise<void> {
  console.log('🧹 Cleaning up test environment...');
  
  // Stop the in-memory MongoDB instance
  const mongod = (global as any).__MONGOD__;
  if (mongod) {
    await mongod.stop();
    console.log('✅ MongoDB test instance stopped');
  }
  
  console.log('✅ Test environment cleanup complete');
}
