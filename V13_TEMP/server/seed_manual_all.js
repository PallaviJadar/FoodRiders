const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Restaurant = require('./models/Restaurant');

dotenv.config();

// --- DATA DEFINITIONS ---

// 1. FoodRiders (Reused)
const foodridersCafeData = {
    "classicPizza": [
        { name: "American Pizza", price: 149, image: "/images/restaurants/foodriders-cafe/pizza/American Pizza.jpg", description: "Delicious pizza with fresh toppings", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] },
        { name: "Mexican Pizza", price: 149, image: "/images/restaurants/foodriders-cafe/pizza/Mexican Pizza.jpg", description: "Delicious pizza with fresh toppings", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] },
        { name: "Margherita", price: 149, image: "/images/restaurants/foodriders-cafe/pizza/Margherita.jpg", description: "Classic cheese pizza", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] }
    ],
    "snacks": [
        { name: "Fingerchips", price: 40, image: "/images/restaurants/foodriders-cafe/snacks/Fungerchips.jpg" },
        { name: "Red Chilli Pasta", price: 40, image: "/images/restaurants/foodriders-cafe/snacks/Red chilli pasta.jpg" },
        { name: "Coffee", price: 40, image: "/images/restaurants/foodriders-cafe/snacks/Coffee (Bru).jpg" }
    ]
};

// 2. Dwaraka (Reused)
const dwarakaData = {
    "Hot Beverages": [
        { name: "BLACK TEA", price: 20 }, { name: "COFFEE", price: 25 }
    ],
    "Breakfast South Indian": [
        { name: "IDLI", price: 22, sizes: [{ size: "S", price: 22 }, { size: "P", price: 40 }] },
        { name: "IDLI VADA", price: 50, sizes: [{ size: "S", price: 50 }, { size: "P", price: 60 }] }
    ],
    "Dosa": [
        { name: "MASALA DOSA", price: 60 }, { name: "SET DOSA", price: 65 }
    ]
};

// 3. Aras Grand (Reused)
const arasGrandData = [
    { "title": "South Indian", "items": [{ "name": "Idli", "price": 25 }, { "name": "Menduvada", "price": 35 }] },
    { "title": "Dosa Items", "items": [{ "name": "Masala Dosa", "price": 60 }] }
];

// 4. Malasa Mangalya (Extracted)
const malasaData = [
    { title: 'Hot Beverages', items: [{ name: 'Tea', price: 10 }, { name: 'Bru Coffee', price: 20 }, { name: 'Milk', price: 20 }] },
    { title: 'South Indian', items: [{ name: 'Upma', price: 27 }, { name: 'Idli', sizes: [{ size: 'Single', price: 20 }, { size: 'Double', price: 35 }] }, { name: 'Vada', sizes: [{ size: 'Single', price: 30 }, { size: 'Double', price: 55 }] }, { name: 'Puri', sizes: [{ size: 'Single', price: 30 }, { size: 'Double', price: 55 }] }] },
    { title: 'Dosa', items: [{ name: 'Masala Dosa', price: 55 }, { name: 'Set Dosa', price: 60 }, { name: 'Rava Dosa', price: 60 }] },
    { title: 'South Indian Meals & Rice', items: [{ name: 'Meals', price: 90 }, { name: 'Rice, Sambar', price: 30 }] },
    { title: 'North Indian', items: [{ name: 'Veg Kadai/Handi', price: 145 }, { name: 'Panneer Butter Masala', price: 150 }, { name: 'Veg Fried Rice', price: 90 }] }
];

// 5. Shankar Idli (Extracted)
const shankarData = [
    { category: "Breakfast Specials", items: [{ name: '1 Plate Idli (3 Piece)', price: 25, description: "Soft and fluffy steamed rice cakes" }, { name: 'Uddin Vada', price: 30, description: "Crispy fried lentil donuts" }] }
];

// 6. Davanagere (Extracted)
const davanagereData = [
    { category: "Specialties", items: [{ name: 'Bennedose Single Piece', price: 35 }, { name: 'Idli Plate', price: 40 }, { name: 'Single Idliwada', price: 45 }, { name: 'Double Idliwada', price: 65 }, { name: 'Paddu Plate (8 Piece)', price: 40 }] }
];

// 7. Nandini (Extracted - Object based)
const nandiniData = {
    "hotBeverages": [{ "name": "Tea", "price": 15 }, { "name": "Coffee", "price": 20 }],
    "southIndianSnack": [{ "name": "Idli (S)", "price": 25 }, { "name": "Masala Dosa", "price": 70 }, { "name": "Paper Dosa", "price": 100 }],
    "thali": [{ "name": "South Indian Meals", "price": 100 }, { "name": "North Indian Meals", "price": 225 }],
    "northIndianDishes": [{ "name": "Paneer Butter Masala", "price": 165 }, { "name": "Veg Kadai", "price": 175 }, { "name": "Dal Fry", "price": 110 }],
    "riceItems": [{ "name": "Veg Biriyani", "price": 125 }, { "name": "Fried Rice", "price": 110 }]
};

// 8. Basaveshwar & Hundekar (Placeholder Khanavali)
const khanavaliData = [
    {
        title: "Daily Special", items: [
            { name: "Jolada Rotti Oota", price: 60, description: "Complete meal with 2 rottis, palya, rice, sambar" },
            { name: "Chapati Oota", price: 50, description: "Complete meal with 2 chapatis, palya, rice, sambar" },
            { name: "Sajje Rotti Oota", price: 60, description: "Special millet rotti meal" },
            { name: "Egg Rice", price: 50 },
            { name: "Rice Sambar", price: 40 }
        ]
    }
];


async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for All-Restaurants Seed");

        // Helper: Format Object to Categories
        const formatObj = (data) => Object.entries(data).map(([key, items]) => ({
            name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            items: items.map(item => ({ ...item, sizes: item.sizes || [], isAvailable: true }))
        }));

        // Helper: Format Array to Categories
        const formatArr = (data, titleKey = "title") => data.map(sec => ({
            name: sec[titleKey] || sec.category,
            items: sec.items.map(item => ({ ...item, sizes: item.sizes || [], isAvailable: true }))
        }));


        // 1. FoodRiders
        await Restaurant.findOneAndUpdate({ name: "FoodRiders Cafe" }, { $set: { categories: formatObj(foodridersCafeData) } }, { new: true, upsert: true });
        console.log("Updated FoodRiders Cafe");

        // 2. Dwaraka
        await Restaurant.findOneAndUpdate({ name: "Dwaraka Restaurant" }, { $set: { categories: formatObj(dwarakaData) } }, { new: true, upsert: true });
        console.log("Updated Dwaraka Restaurant");

        // 3. Aras Grand
        await Restaurant.findOneAndUpdate({ name: "Aras Grand" }, { $set: { categories: formatArr(arasGrandData) } }, { new: true, upsert: true });
        console.log("Updated Aras Grand");

        // 4. Malasa Mangalya
        await Restaurant.findOneAndUpdate({ name: "Malasa Mangally Hotel" }, { $set: { categories: formatArr(malasaData) } }, { new: true, upsert: true });
        console.log("Updated Malasa Mangalya");

        // 5. Shankar Idli
        await Restaurant.findOneAndUpdate({ name: "Shankar Idli Center" }, { $set: { categories: formatArr(shankarData, "category") } }, { new: true, upsert: true });
        console.log("Updated Shankar Idli Center");

        // 6. Davanagere
        await Restaurant.findOneAndUpdate({ name: "Davanagere Bennedose Center" }, { $set: { categories: formatArr(davanagereData, "category") } }, { new: true, upsert: true });
        console.log("Updated Davanagere Bennedose");

        // 7. Nandini
        await Restaurant.findOneAndUpdate({ name: "Hotel Nandini Deluxe" }, { $set: { categories: formatObj(nandiniData) } }, { new: true, upsert: true });
        console.log("Updated Hotel Nandini Deluxe");

        // 8. Basaveshwar
        await Restaurant.findOneAndUpdate({ name: "Basaveshwar Lingayat Khanavali" }, { $set: { categories: formatArr(khanavaliData, "title") } }, { new: true, upsert: true });
        console.log("Updated Basaveshwar Khanavali");

        // 9. Hundekar
        await Restaurant.findOneAndUpdate({ name: "Hundekar Khanavali" }, { $set: { categories: formatArr(khanavaliData, "title") } }, { new: true, upsert: true });
        console.log("Updated Hundekar Khanavali");

        // 10. Prabhu Malabadi (Proxy to Khanavali)
        await Restaurant.findOneAndUpdate({ name: "Prabhu Malabadi Khanavali" }, { $set: { categories: formatArr(khanavaliData, "title") } }, { new: true, upsert: true });
        console.log("Updated Prabhu Malabadi Khanavali");


        console.log("ALL RESTAURANTS MIGRATED SUCCESSFULLY.");
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
