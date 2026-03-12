const mongoose = require('mongoose');
const dotenv = require('dotenv');
const CategoryGroup = require('./models/CategoryGroup');
const HomeDeliverySection = require('./models/HomeDeliverySection');
const Restaurant = require('./models/Restaurant');

dotenv.config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Update Food Categories Group to use Veg/Non-Veg
        let foodGroup = await CategoryGroup.findOne({ name: 'Food & Restaurants' });
        if (foodGroup) {
            foodGroup.categories = [
                { name: 'Pure Veg', image: 'homestyle.png' },
                { name: 'Non-Veg', image: 'chicken.png' }
            ];
            await foodGroup.save();
            console.log('Updated Food Group with Veg/Non-Veg');
        }

        // 2. Tag restaurants so they appear in these categories
        const vegRests = [
            "FoodRiders Cafe", "Dwaraka Restaurant", "Aras Grand",
            "Malasa Mangally Hotel", "Shankar Idli Center",
            "Davanagere Bennedose Center", "Basaveshwar Lingayat Khanavali",
            "Hundekar Khanavali", "Prabhu Malabadi Khanavali"
        ];

        const nonVegRests = ["Hotel Nandini Deluxe", "Manish Restaurant", "U K Dhaba"];

        await Restaurant.updateMany({ name: { $in: vegRests } }, { $addToSet: { tags: 'Pure Veg' } });
        await Restaurant.updateMany({ name: { $in: nonVegRests } }, { $addToSet: { tags: 'Non-Veg' } });

        console.log('Tagged restaurants for Veg/Non-Veg discovery');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
