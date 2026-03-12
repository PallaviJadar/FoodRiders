const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const Restaurant = require('./models/Restaurant');

function normalize(s) {
    if (!s) return "";
    return s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function getCsvData(csvPath) {
    if (!fs.existsSync(csvPath)) return {};
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    const data = {};
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length < 3) continue;
        const res = parts[0].trim();
        const cat = parts[1].trim();
        const item = parts[2].trim();
        // const img = parts.length > 3 ? parts[3].trim() : "";

        if (!data[res]) data[res] = {};
        if (!data[res][cat]) data[res][cat] = [];
        data[res][cat].push({ name: item });
    }
    return data;
}

const IMG_DEFAULTS = {
    "gokulhotel": "res_gokul.png",
    "manishrestaurant": "res_manish.png",
    "ukdhaba": "res_uk_dhaba.png",
    "cakewalabakery": "res_cakewala.png",
    "prabhumalabadikhanavali": "res_prabhu.png",
    "basaveshwarlingayatkhanavali": "res_basaveshwar.png",
    "hundekarkhanavali": "res_hundekar.png"
};

async function forceSeed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const CSV_DATA = getCsvData(path.join(__dirname, '../FoodRiders_Complete_Menu_Report_Exhaustive.csv'));
        console.log("CSV KEYS:", Object.keys(CSV_DATA));

        const TARGETS = [
            "Gokul Hotel",
            "Manish Restaurant",
            "U K Dhaba",
            "Cakewala Bakery",
            "Prabhu Malabadi Khanavali",
            "Basaveshwar Lingayat Khanavali",
            "Hundekar Khanavali"
        ];

        for (const t of TARGETS) {
            console.log(`\nRe-seeding ${t}...`);
            const csvCats = CSV_DATA[t];
            if (!csvCats) {
                console.log("No CSV data found!");
                continue;
            }

            let categories = [];
            for (const [catName, items] of Object.entries(csvCats)) {
                let catItems = [];
                for (const item of items) {
                    const isVeg = ["paneer", "veg", "aloo", "gobi"].some(k => item.name.toLowerCase().includes(k));
                    catItems.push({
                        name: item.name,
                        price: 150,
                        image: "",
                        description: isVeg ? "Veg Delicacy" : "Tasty Item",
                        isAvailable: true,
                        sizes: []
                    });
                }
                categories.push({ name: catName, items: catItems });
            }

            // DELETE EXISTING
            await Restaurant.deleteOne({ name: t });

            // CREATE NEW
            const normName = normalize(t);
            const img = IMG_DEFAULTS[normName] || "default.jpg";

            await Restaurant.create({
                name: t,
                categories: categories,
                image: img,
                rating: 4.2,
                deliveryTime: 35,
                address: "Mahalingapura",
                location: { lat: 16.3860, lng: 75.1202 },
                tags: ["Restaurant"],
                deliveryRadius: 5,
                deliveryAreas: ["Mahalingapura"]
            });

            console.log(`  Created with ${categories.reduce((s, c) => s + c.items.length, 0)} items.`);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

forceSeed();
