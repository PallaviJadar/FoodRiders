require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');

const testDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');
        
        const restaurants = await Restaurant.find().select('name bridgeCategories tags isVeg onlyVeg');
        console.log(`Found ${restaurants.length} restaurants:`);
        restaurants.forEach(r => {
            console.log(`- ${r.name}: Tags=[${r.tags}], Bridge=[${r.bridgeCategories}], isVeg=${r.isVeg}, onlyVeg=${r.onlyVeg}`);
        });
        
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
};

testDB();
