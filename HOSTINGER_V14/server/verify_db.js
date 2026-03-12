const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Restaurant = require('./models/Restaurant');

async function verifyDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const restaurants = await Restaurant.find({});
        
        console.log('=== DATABASE VERIFICATION ===\n');
        console.log(`Total Restaurants: ${restaurants.length}\n`);
        
        let grandTotal = 0;
        
        restaurants.forEach((restaurant, index) => {
            const itemCount = restaurant.categories.reduce((sum, cat) => sum + cat.items.length, 0);
            grandTotal += itemCount;
            console.log(`${index + 1}. ${restaurant.name}`);
            console.log(`   Items: ${itemCount}`);
            console.log(`   Categories: ${restaurant.categories.length}`);
            console.log(`   Rating: ${restaurant.rating || 'N/A'}`);
            console.log(`   Address: ${restaurant.address || 'N/A'}`);
            console.log('');
        });
        
        console.log('=========================');
        console.log(`\n🎉 TOTAL MENU ITEMS: ${grandTotal}\n`);
        
        if (grandTotal >= 800) {
            console.log('✅ SUCCESS: Database has 800+ items!');
        } else {
            console.log(`⚠️  WARNING: Only ${grandTotal} items (need 800+)`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verifyDatabase();
