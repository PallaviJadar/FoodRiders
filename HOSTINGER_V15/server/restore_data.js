const mongoose = require('mongoose');

async function restore() {
    const sourceConn = await mongoose.createConnection('mongodb://127.0.0.1:27018/foodriders').asPromise();
    const targetConn = await mongoose.createConnection('mongodb://127.0.0.1:27017/foodriders').asPromise();

    const collections = ['restaurants', 'users', 'orders'];

    for (const colName of collections) {
        console.log(`Restoring collection: ${colName}...`);
        const data = await sourceConn.collection(colName).find().toArray();
        console.log(`  Found ${data.length} documents in source.`);

        await targetConn.collection(colName).deleteMany({});
        console.log(`  Cleared target collection.`);

        if (data.length > 0) {
            await targetConn.collection(colName).insertMany(data);
            console.log(`  Inserted ${data.length} documents into target.`);
        }
    }

    await sourceConn.close();
    await targetConn.close();
    console.log('RESTORE COMPLETE');
    process.exit(0);
}

restore().catch(err => {
    console.error('RESTORE FAILED:', err);
    process.exit(1);
});
