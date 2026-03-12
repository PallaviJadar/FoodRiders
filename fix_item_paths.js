const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const restaurants = await db.collection('restaurants').find({}).toArray();

        console.log(`Fixing ${restaurants.length} restaurants...`);

        for (let r of restaurants) {
            let changed = false;
            r.categories?.forEach(cat => {
                cat.items?.forEach(item => {
                    // If image doesn't start with /uploads/ or http or data:, fix it
                    if (item.image &&
                        !item.image.startsWith('/uploads/') &&
                        !item.image.startsWith('http') &&
                        !item.image.startsWith('data:')) {
                        item.image = '/uploads/' + item.image;
                        changed = true;
                    }
                });
            });

            if (changed) {
                await db.collection('restaurants').updateOne({ _id: r._id }, { $set: { categories: r.categories } });
                console.log(`✅ Fixed paths for ${r.name}`);
            }
        }
        console.log('✨ All item paths updated to include /uploads/');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

fix();
