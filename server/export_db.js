const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create dump directory
const DUMP_DIR = path.join(__dirname, 'db_dump');
if (!fs.existsSync(DUMP_DIR)) {
    fs.mkdirSync(DUMP_DIR);
}

const exportData = async () => {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections.`);

        for (const collection of collections) {
            const name = collection.name;
            console.log(`Exporting ${name}...`);
            const data = await mongoose.connection.db.collection(name).find({}).toArray();
            fs.writeFileSync(path.join(DUMP_DIR, `${name}.json`), JSON.stringify(data, null, 2));
        }

        console.log(`\nSUCCESS: Database dumped to ${DUMP_DIR}`);
        process.exit(0);
    } catch (err) {
        console.error("Export Failed:", err);
        process.exit(1);
    }
};

exportData();
