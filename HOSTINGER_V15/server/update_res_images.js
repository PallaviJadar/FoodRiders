const mongoose = require('mongoose');
require('dotenv').config();
const Restaurant = require('./models/Restaurant');

const IMG_MAP = {
    "Dwaraka Restaurant": "res_dwaraka.jpg",
    "Hotel Nandini Deluxe": "res_nandini.png",
    "Aras Grand": "res_aras.jpg",
    "FoodRiders Cafe": "res_foodriders.png",
    "Shankar Idli Center": "res_shankar.jpg",
    "Dovanagere Bennedose Center": "res_davanagere.jpg",
    "Davanagere Bennedose Center": "res_davanagere.jpg", // Handle spelling variation
    "Basaveshwar Lingayat Khanavali": "res_basaveshwar.png",
    "Hundekar Khanavali": "res_hundekar.png",
    "Prabhu Malabadi Khanavali": "res_prabhu.png",
    "Manish Restaurant": "res_manish.png",
    "U K Dhaba": "res_uk_dhaba.png",
    "Cakewala Bakery": "res_cakewala.png",
    "Gokul Hotel": "res_gokul.png",
    "Malasa Mangally Hotel": "res_malasa.png"
};

async function updateImages() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB.");

        for (const [name, img] of Object.entries(IMG_MAP)) {
            const res = await Restaurant.findOneAndUpdate(
                { name: name },
                { $set: { image: img } },
                { new: true }
            );
            if (res) {
                console.log(`Updated ${name} -> ${img}`);
            } else {
                console.log(`Skipped ${name} (Not found)`);
            }
        }

        // Remove "Debug Update" if exists
        await Restaurant.deleteOne({ name: "Debug Update" });
        console.log("Removed Debug Update entry");

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

updateImages();
