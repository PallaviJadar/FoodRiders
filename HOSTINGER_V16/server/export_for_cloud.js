const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const exportDir = path.join(__dirname, 'db_export');
if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
}

const exportData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to Local DB for Export...');

        // Define models generically or simply list collections
        const collections = ['users', 'restaurants', 'orders', 'homedeliverysections', 'announcements', 'carouselitems'];

        for (const colName of collections) {
            const data = await mongoose.connection.db.collection(colName).find({}).toArray();
            fs.writeFileSync(path.join(exportDir, `${colName}.json`), JSON.stringify(data, null, 2));
            console.log(`Exported ${data.length} items from ${colName}`);
        }

        console.log('Export Complete! Files saved in server/db_export');
        process.exit(0);
    } catch (err) {
        console.error('Export Failed:', err);
        process.exit(1);
    }
};

exportData();
