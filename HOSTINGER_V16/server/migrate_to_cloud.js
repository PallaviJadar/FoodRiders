const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const importData = async () => {
    try {
        console.log('Connecting to MongoDB Atlas...');
        console.log('URI:', process.env.MONGO_URI.replace(/:([^:@]{1,})@/, ':****@')); // Hide password in logs

        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('✅ Connected to MongoDB Atlas!');

        const exportDir = path.join(__dirname, 'db_export');
        if (!fs.existsSync(exportDir)) {
            console.error('❌ No db_export folder found. Run export_for_cloud.js first (but switch .env back to local first if needed).');
            process.exit(1);
        }

        // Map files to Models
        const mappings = [
            { file: 'users.json', model: require('./models/User') },
            { file: 'restaurants.json', model: require('./models/Restaurant') },
            { file: 'orders.json', model: require('./models/Order') },
            { file: 'homedeliverysections.json', model: require('./models/HomeDeliverySection') },
            { file: 'announcements.json', model: require('./models/Announcement') },
            { file: 'carouselitems.json', model: require('./models/CarouselItem') }
        ];

        for (const { file, model } of mappings) {
            const filePath = path.join(exportDir, file);
            if (fs.existsSync(filePath)) {
                const rawData = fs.readFileSync(filePath, 'utf-8');
                const data = JSON.parse(rawData);

                if (data.length > 0) {
                    // Optional: Clear existing data to avoid duplicates or use upsert. 
                    // For safety in a "migration", we might want to deleteMany first or just insert.
                    // Let's use deleteMany to ensure a clean state matching local.
                    console.log(`Clearing old data from ${model.modelName}...`);
                    await model.deleteMany({});

                    console.log(`Importing ${data.length} records into ${model.modelName}...`);
                    // Remove _id if you want new IDs, but keeping _id is better for preserving relationships (like orders referencing users)
                    // MongoDB allows inserting documents with _id.
                    await model.insertMany(data);
                    console.log(`✅ ${model.modelName} imported successfully.`);
                } else {
                    console.log(`Skipping ${file} (empty).`);
                }
            } else {
                console.warn(`⚠️ File ${file} not found locally.`);
            }
        }

        console.log('🚀 All data migrated to Cloud Database successfully!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    }
};

importData();
