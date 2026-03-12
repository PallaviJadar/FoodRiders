const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkSettings() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const models = ['SystemSettings', 'ReferralSettings', 'Coupon', 'User'];
        for (const modelName of models) {
            try {
                const schema = new mongoose.Schema({ d: mongoose.Schema.Types.Mixed }, { strict: false });
                const Model = mongoose.model(modelName, schema, modelName.toLowerCase() + 's');
                const doc = await Model.findOne();
                if (doc) {
                    console.log(`\nSample from ${modelName}:`, JSON.stringify(doc, null, 2));
                } else {
                    console.log(`\nNo documents in ${modelName}`);
                }
            } catch (e) {
                console.log(`Failed to read ${modelName}:`, e.message);
            }
        }

        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkSettings();
