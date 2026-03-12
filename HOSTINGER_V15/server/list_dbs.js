const mongoose = require('mongoose');
require('dotenv').config();

async function listDbs() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const result = await admin.listDatabases();
        console.log('Databases:');
        result.databases.forEach(db => console.log(` - ${db.name}`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listDbs();
