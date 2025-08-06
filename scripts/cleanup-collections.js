const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://eaysin-dev:VZbp84aaA8hSV5vY@cluster0.uzmru.mongodb.net/second-brain?retryWrites=true&w=majority&appName=second-brain-server';

async function cleanupCollections() {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        // Check all databases
        const adminDb = client.db().admin();
        const databases = await adminDb.listDatabases();
        console.log('\nAll databases:');
        databases.databases.forEach(db => {
            console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });

        // Check collections across all databases
        let totalCollections = 0;
        for (const database of databases.databases) {
            if (database.name !== 'admin' && database.name !== 'local') {
                const db = client.db(database.name);
                const collections = await db.listCollections().toArray();
                console.log(`\n${database.name} collections (${collections.length}):`);
                collections.forEach(col => console.log(`  - ${col.name}`));
                totalCollections += collections.length;
            }
        }

        console.log(`\n🔢 Total collections across all databases: ${totalCollections}`);

        const db = client.db('second-brain');
        
        // List all collections
        const collections = await db.listCollections().toArray();
        console.log(`Total collections: ${collections.length}`);
        
        // Core collections that should be kept
        const coreCollections = [
            'users',
            'tasks',
            'databases',
            'database_records',
            'database_categories',
            'workspaces',
            'files',
            'tags',
            'notifications'
        ];
        
        console.log('\nCore collections:');
        coreCollections.forEach(name => console.log(`  - ${name}`));
        
        // Find collections to potentially remove
        const collectionsToCheck = collections.filter(col => 
            !coreCollections.includes(col.name) && 
            !col.name.startsWith('system.')
        );
        
        console.log(`\nCollections that could be removed (${collectionsToCheck.length}):`);
        collectionsToCheck.forEach(col => console.log(`  - ${col.name}`));
        
        // Show collection sizes
        console.log('\nCollection document counts:');
        for (const coreCol of coreCollections) {
            try {
                const count = await db.collection(coreCol).countDocuments();
                console.log(`  ${coreCol}: ${count} documents`);
            } catch (error) {
                console.log(`  ${coreCol}: collection doesn't exist`);
            }
        }
        
        console.log('\n⚠️  RECOMMENDED CLEANUP:');
        console.log('1. Drop mydatabase_copy (463 collections) - appears to be a backup');
        console.log('2. Drop sample_mflix (6 collections) - MongoDB sample data');
        console.log('3. Consider cleaning up test database (13 collections)');

        console.log('\n🚨 DANGER ZONE - Uncomment to actually delete databases:');

        // UNCOMMENT THE FOLLOWING LINES TO ACTUALLY DELETE DATABASES
        console.log('\n🗑️  Removing unnecessary databases...');

        // Drop the backup database (463 collections)
        console.log('  Dropping mydatabase_copy database...');
        await client.db('mydatabase_copy').dropDatabase();

        // Drop sample data (6 collections)
        console.log('  Dropping sample_mflix database...');
        await client.db('sample_mflix').dropDatabase();

        // Optionally drop test database (13 collections)
        console.log('  Dropping test database...');
        await client.db('test').dropDatabase();

        console.log('✅ Database cleanup completed');
        console.log('🎉 You should now be able to create new collections!');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

cleanupCollections();
