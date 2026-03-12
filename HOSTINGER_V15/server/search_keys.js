const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function findKeys() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const collInfo of collections) {
            const collection = mongoose.connection.db.collection(collInfo.name);
            const doc = await collection.findOne({
                $or: [
                    { cloud_name: { $exists: true } },
                    { cloudinary_name: { $exists: true } },
                    { CLOUDINARY_CLOUD_NAME: { $exists: true } },
                    { api_key: { $exists: true } },
                    { secret: { $exists: true } },
                    { name: /cloud/i }
                ]
            });
            if (doc) {
                console.log(`\nPotential Keys found in [${collInfo.name}]:`);
                console.log(JSON.stringify(doc, null, 2));
            }
        }

        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

findKeys();
