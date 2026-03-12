const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const VEG_RESTS = [
    "Dwaraka Restaurant", "Hotel Nandini Deluxe", "Aras Grand", "Malasa Mangally Hotel",
    "Shankar Idli Center", "Dovanagere Bennedose Center", "FoodRiders Cafe",
    "Cakewala Bakery", "Prabhu Malabadi Khanavali", "Basaveshwar Lingayat Khanavali",
    "Hundekar Khanavali", "Gokul Hotel"
];

const NON_VEG_RESTS = [
    "Manish Restaurant", "U K Dhaba"
];

async function fixTags() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB to fix tags...");

        for (const name of VEG_RESTS) {
            await Restaurant.findOneAndUpdate({ name }, { $addToSet: { tags: "Pure Veg" } });
        }

        for (const name of NON_VEG_RESTS) {
            await Restaurant.findOneAndUpdate({ name }, { $addToSet: { tags: "Non Veg" } });
        }

        console.log("Tags fixed successfully.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fixTags();
