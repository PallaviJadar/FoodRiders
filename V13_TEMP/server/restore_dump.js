const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const restoreRestaurants = async () => {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const dumpFile = path.join(__dirname, 'db_dump', 'restaurants.json');
        if (!fs.existsSync(dumpFile)) {
            console.error("Dump file not found!");
            process.exit(1);
        }

        const rawData = fs.readFileSync(dumpFile, 'utf8');
        const restaurants = JSON.parse(rawData);
        console.log(`Found ${restaurants.length} restaurants in dump.`);

        // Fix _id and other ObjectId fields if necessary (usually mongoose handles string->ObjectId if schema matches, but bulkWrite might be safer or just deleteMany + insertMany)
        // We will use deleteMany + insertMany

        console.log("Clearing existing restaurants...");
        await require('./models/Restaurant').deleteMany({});

        console.log("Inserting dumped data...");
        await require('./models/Restaurant').insertMany(restaurants);

        console.log("Restore Complete.");

        // Verify count
        let total = 0;
        const all = await require('./models/Restaurant').find({});
        all.forEach(r => r.categories.forEach(c => total += c.items.length));
        console.log(`Grand Total Items in DB: ${total}`);

        process.exit(0);
    } catch (err) {
        console.error("Restore Failed:", err);
        process.exit(1);
    }
};

restoreRestaurants();
