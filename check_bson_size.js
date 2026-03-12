const mongoose = require('mongoose');
require('dotenv').config();

async function checkSizes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const results = await db.collection('restaurants').aggregate([
            {
                $project: {
                    name: 1,
                    size: { $bsonSize: "$$ROOT" },
                    catCount: { $size: { $ifNull: ["$categories", []] } }
                }
            },
            { $sort: { size: -1 } }
        ]).toArray();

        console.log('--- Restaurant Document Sizes ---');
        results.forEach(r => {
            console.log(`${r.name.padEnd(30)}: ${(r.size / 1024).toFixed(2)} KB (${r.catCount} categories)`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

checkSizes();
