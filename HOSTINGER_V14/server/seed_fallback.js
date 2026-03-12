const mongoose = require('mongoose');
require('dotenv').config();
const Restaurant = require('./models/Restaurant');

const FALLBACK_MENUS = {
    "Gokul Hotel": [
        { name: "Breakfast", items: ["Idli", "Vada", "Dosa", "Puri", "Upma"] },
        { name: "Meals", items: ["South Indian Thali", "Rice Bath", "Curd Rice"] },
        { name: "Beverages", items: ["Tea", "Coffee", "Badam Milk"] }
    ],
    "Manish Restaurant": [
        { name: "Starters", items: ["Veg Manchurian", "Paneer Chilli", "Gobi 65"] },
        { name: "Main Course", items: ["Kadai Paneer", "Dal Fry", "Veg Kolhapuri", "Butter Naan", "Roti"] },
        { name: "Rice", items: ["Veg Biryani", "Jeera Rice", "Fried Rice"] }
    ],
    "U K Dhaba": [
        { name: "Starters", items: ["Chicken 65", "Chilli Chicken", "Egg Burji", "Gobi Manchurian"] },
        { name: "Curries", items: ["Butter Chicken", "Chicken Masala", "Egg Curry", "Dal Tadka"] },
        { name: "Breads", items: ["Tandoori Roti", "Butter Naan", "Kulcha"] },
        { name: "Rice", items: ["Chicken Biryani", "Egg Biryani", "Jeera Rice"] }
    ],
    "Cakewala Bakery": [
        { name: "Cakes", items: ["Black Forest", "Chocolate Truffle", "Pineapple Cake", "Red Velvet"] },
        { name: "Pastries", items: ["Chocolate Pastry", "Butterscotch Pastry", "Black Forest Pastry"] },
        { name: "Snacks", items: ["Veg Puff", "Egg Puff", "Chicken Puff", "Sandwich"] },
        { name: "Breads", items: ["Milk Bread", "Wheat Bread", "Bun"] }
    ],
    "Prabhu Malabadi Khanavali": [
        { name: "Meals", items: ["Jolada Rotti Oota", "Chapati Meal", "Holige Oota"] },
        { name: "Sides", items: ["Ennegayi", "Kaalu Palya", "Curd"] }
    ],
    "Basaveshwar Lingayat Khanavali": [
        { name: "Meals", items: ["Lingayat Special Thali", "Jolada Rotti Meal", "Rice Plate"] },
        { name: "Daily Specials", items: ["Shenga Holige", "Madike Kaalu"] }
    ],
    "Hundekar Khanavali": [
        { name: "Meals", items: ["Full Meals", "Rotti Oota", "Rice Sambar"] },
        { name: "Extras", items: ["Papad", "Pickle", "Butter Milk"] }
    ]
};

const IMG_DEFAULTS = {
    "Gokul Hotel": "res_gokul.png",
    "Manish Restaurant": "res_manish.png",
    "U K Dhaba": "res_uk_dhaba.png",
    "Cakewala Bakery": "res_cakewala.png",
    "Prabhu Malabadi Khanavali": "res_prabhu.png",
    "Basaveshwar Lingayat Khanavali": "res_basaveshwar.png",
    "Hundekar Khanavali": "res_hundekar.png"
};

async function seedFallback() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        for (const [name, menu] of Object.entries(FALLBACK_MENUS)) {
            console.log(`Seeding fallback for ${name}...`);

            const categories = menu.map(cat => ({
                name: cat.name,
                items: cat.items.map(itemName => ({
                    name: itemName,
                    price: 150, // Placeholder
                    description: "Delicious " + itemName,
                    image: "", // Only use if we have specific images
                    isAvailable: true,
                    sizes: []
                }))
            }));

            await Restaurant.deleteOne({ name: name }); // Ensure clean slate

            const image = IMG_DEFAULTS[name] || "default_res.jpg";

            await Restaurant.create({
                name: name,
                address: "Mahalingapura",
                rating: 4.2,
                deliveryTime: 30, // Number
                image: image,
                categories: categories,
                location: { lat: 16.3860, lng: 75.1202 },
                tags: ["Restaurant", "Veg"], // Basic tag
                deliveryRadius: 5
            });
            console.log("  Success.");
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seedFallback();
