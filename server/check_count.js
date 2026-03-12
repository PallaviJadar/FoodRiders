const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const restaurants = await Restaurant.find({});
        let total = 0;
        restaurants.forEach(r => {
            r.categories.forEach(c => {
                total += c.items.length;
            });
        });
        console.log(`Total Menu Items in DB: ${total}`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

connectDB();
