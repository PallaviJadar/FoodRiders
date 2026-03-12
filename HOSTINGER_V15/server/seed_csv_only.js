const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Restaurant = require('./models/Restaurant');

dotenv.config();

function normalize(s) {
    if (!s) return "";
    return s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function getManifest() {
    try {
        const manifestPath = path.join(__dirname, '../src/utils/imageManifest.js');
        if (fs.existsSync(manifestPath)) {
            const content = fs.readFileSync(manifestPath, 'utf8');
            const match = content.match(/export const imageManifest = ({[\s\S]*?});/);
            if (match) {
                const cleanJson = match[1].replace(/\/\/.*/g, '');
                return new Function(`return ${cleanJson}`)();
            }
        }
    } catch (e) { console.error("Manifest Error"); }
    return {};
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
        const img = parts.length > 3 ? parts[3].trim() : "";

        if (!data[res]) data[res] = {};
        if (!data[res][cat]) data[res][cat] = [];
        data[res][cat].push({ name: item, image: img });
    }
    return data;
}

const FEED_MAP_NAMES = [
    "Dwaraka Restaurant",
    "Hotel Nandini Deluxe",
    "Aras Grand",
    "Malasa Mangally Hotel",
    "FoodRiders Cafe",
    "Shankar Idli Center",
    "Dovanagere Bennedose Center",
    "Davanagere Bennedose Center"
].map(normalize);

const IMG_DEFAULTS = {
    "gokulhotel": "res_gokul.png",
    "manishrestaurant": "res_manish.png",
    "ukdhaba": "res_uk_dhaba.png",
    "cakewalabakery": "res_cakewala.png",
    "prabhumalabadikhanavali": "res_prabhu.png",
    "basaveshwarlingayatkhanavali": "res_basaveshwar.png",
    "hundekarkhanavali": "res_hundekar.png"
};

async function seedCsvOnly() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const MANIFEST = getManifest();
        const CSV_DATA = getCsvData(path.join(__dirname, '../FoodRiders_Complete_Menu_Report_Exhaustive.csv'));

        // Resolve Image Helper
        function resolveImage(resName, catName, itemName, currentImage) {
            if (currentImage && currentImage.length > 5 && !currentImage.includes("default.jpg")) return currentImage;

            let resKey = normalize(resName);
            const key = `${resKey}|${normalize(catName)}|${normalize(itemName)}`;
            if (MANIFEST[key]) return MANIFEST[key];

            return "";
        }

        for (const [resName, catData] of Object.entries(CSV_DATA)) {
            if (FEED_MAP_NAMES.includes(normalize(resName))) {
                console.log(`Skipping ${resName} (Already processed via Code)`);
                continue;
            }

            console.log(`Processing CSV-Only: ${resName}...`);
            let categories = [];

            for (const [catName, items] of Object.entries(catData)) {
                let catItems = [];
                for (const item of items) {
                    const img = resolveImage(resName, catName, item.name, item.image);
                    const isVeg = ["paneer", "veg", "aloo", "gobi", "mushroom"].some(k => item.name.toLowerCase().includes(k));

                    catItems.push({
                        name: item.name,
                        price: 150, // Default price
                        image: img,
                        description: isVeg ? "Pure Veg Delicacy" : "Delicious Item",
                        isAvailable: true,
                        sizes: []
                    });
                }
                categories.push({ name: catName, items: catItems });
            }

            // Update DB
            // First get existing meta to key nice image
            const normName = normalize(resName);
            const mainImage = IMG_DEFAULTS[normName] || "default_res.jpg";

            let res = await Restaurant.findOne({ name: resName });
            if (res) {
                console.log(`  Updating existing ${resName}...`);
                res.categories = categories;
                res.image = mainImage;
                await res.save();
            } else {
                console.log(`  Creating new ${resName}...`);
                await Restaurant.create({
                    name: resName,
                    categories: categories,
                    image: mainImage,
                    rating: 4.2,
                    deliveryTime: 35,
                    address: "Mahalingapura",
                    location: { lat: 16.3860, lng: 75.1202 },
                    tags: ["Restaurant"],
                    deliveryRadius: 5,
                    deliveryAreas: ["Mahalingapura"]
                });
            }

            const total = categories.reduce((s, c) => s + c.items.length, 0);
            console.log(`  Saved ${resName}: ${total} items`);
        }

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seedCsvOnly();
