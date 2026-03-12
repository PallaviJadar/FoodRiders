const mongoose = require('mongoose');
require('dotenv').config();

async function fixPaths() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const restaurants = await db.collection('restaurants').find({}).toArray();

        console.log(`Fixing paths for ${restaurants.length} restaurants...`);

        for (let r of restaurants) {
            let changed = false;
            r.categories?.forEach(cat => {
                cat.items?.forEach(item => {
                    // Remove both /uploads/ and uploads/ (leading slash or not)
                    if (item.image && (item.image.startsWith('/uploads/') || item.image.startsWith('uploads/'))) {
                        item.image = item.image.replace(/^\/?uploads\//, '');
                        changed = true;
                    }
                });
            });

            if (changed) {
                await db.collection('restaurants').updateOne({ _id: r._id }, { $set: { categories: r.categories } });
                console.log(`✅ Cleaned data for ${r.name}`);
            }
        }
        console.log('✨ Data cleanup complete. Filenames only now.');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

fixPaths();
