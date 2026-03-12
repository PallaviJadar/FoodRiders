const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Restaurant = require('./models/Restaurant');

dotenv.config();

// 1. Load Nandini from JSON
const nandiniRaw = JSON.parse(fs.readFileSync('nandini_final.json', 'utf8'));

// 2. Hardcoded Data for Others (Based on previous inspections)

const malasaData = [
    { title: 'Hot Beverages', items: [{ name: 'Tea', price: 10 }, { name: 'Bru Coffee', price: 20 }, { name: 'KT', price: 20 }, { name: 'Bournvita', price: 25 }, { name: 'Horlicks', price: 25 }, { name: 'Milk', price: 20 }, { name: 'Black Tea', price: 15 }, { name: 'Kashaya', price: 20 }] },
    { title: 'South Indian', items: [{ name: 'Upma', price: 27 }, { name: 'Sheera', price: 35 }, { name: 'Idli', sizes: [{ size: 'Single', price: 20 }, { size: 'Double', price: 35 }] }, { name: 'Vada', sizes: [{ size: 'Single', price: 30 }, { size: 'Double', price: 55 }] }, { name: 'Idli Vada', sizes: [{ size: 'Single', price: 50 }, { size: 'Double', price: 62 }] }, { name: 'Puri', sizes: [{ size: 'Single', price: 30 }, { size: 'Double', price: 55 }] }, { name: 'Kurma Puri', sizes: [{ size: 'Single', price: 37 }] }, { name: 'Rice Palav', price: 30 }] },
    { title: 'Dosa', items: [{ name: 'Akki Dosa', sizes: [{ size: 'Single', price: 30 }, { size: 'Double', price: 55 }] }, { name: 'Masala Dosa', price: 55 }, { name: 'Paper Masala Dosa', price: 65 }, { name: 'Set Dosa', price: 60 }, { name: 'Rava Dosa', price: 60 }] },
    { title: 'South Indian Meals & Rice', items: [{ name: 'Meals', price: 90 }, { name: 'Rice, Sambar', price: 30 }, { name: 'Tandoori Roti Meals', price: 110 }] },
    { title: 'Chats', items: [{ name: 'Bhelpuri', price: 30 }, { name: 'Shevpuri', price: 30 }, { name: 'Panipuri', price: 30 }, { name: 'Dahipuri', price: 30 }] },
    { title: 'Soup', items: [{ name: 'Tomato Soup', price: 70 }, { name: 'Manchow Soup', price: 70 }] },
    { title: 'Chinese', items: [{ name: 'Gobi Manchurian', price: 65 }, { name: 'Gobi 65', price: 75 }, { name: 'Paneer Chilly', price: 130 }, { name: 'Veg Fried Rice', price: 90 }, { name: 'Veg Hakka Noodles', price: 100 }] },
    { title: 'North Indian', items: [{ name: 'Veg Kadai', price: 145 }, { name: 'Paneer Butter Masala', price: 150 }, { name: 'Kaju Masala', price: 150 }, { name: 'Dal Fry', price: 110 }, { name: 'Butter Naan', price: 40 }, { name: 'Roti', price: 25 }] },
    { title: 'Rice & Biriyani', items: [{ name: 'Veg Biriyani', price: 120 }, { name: 'Paneer Biriyani', price: 130 }, { name: 'Jeera Rice', price: 90 }, { name: 'Curd Rice', price: 90 }] },
    { title: 'Juice & Milkshakes', items: [{ name: 'Mosambi', price: 55 }, { name: 'Apple', price: 60 }, { name: 'Mango Milkshake', price: 60 }] }
];

const shankarData = [
    { category: "Breakfast Specials", items: [{ name: '1 Plate Idli (3 Piece)', price: 25, description: "Soft and fluffy steamed rice cakes" }, { name: 'Uddin Vada', price: 30, description: "Crispy fried lentil donuts" }] }
];

const davanagereData = [
    { category: "Specialties", items: [{ name: 'Bennedose Single Piece', price: 35 }, { name: 'Idli Plate', price: 40 }, { name: 'Single Idliwada', price: 45 }, { name: 'Double Idliwada', price: 65 }, { name: 'Paddu Plate (8 Piece)', price: 40 }] }
];

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
        console.log("Connected to MongoDB for Final Restoration");

        // Helper: Format Object to Categories - Strip generic 'id' to avoid Mongoose conflicts
        const formatObj = (data) => Object.entries(data).map(([key, items]) => ({
            name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            items: items.map(({ id, ...item }) => ({ ...item, sizes: item.sizes || [], isAvailable: true }))
        }));

        // Helper: Format Array to Categories
        const formatArr = (data, titleKey = "title") => data.map(sec => ({
            name: sec[titleKey] || sec.category,
            items: sec.items.map(({ id, ...item }) => ({ ...item, sizes: item.sizes || [], isAvailable: true }))
        }));

        // 1. Restore Nandini (Critical)
        await Restaurant.findOneAndUpdate({ name: "Hotel Nandini Deluxe" }, { $set: { categories: formatObj(nandiniRaw) } }, { new: true, upsert: true });
        console.log("Restored Hotel Nandini Deluxe");

        // 2. Restore Malasa Mangalya (Critical)
        await Restaurant.findOneAndUpdate({ name: "Malasa Mangally Hotel" }, { $set: { categories: formatArr(malasaData) } }, { new: true, upsert: true });
        console.log("Restored Malasa Mangalya");

        // 3. Restore Shankar Idli
        await Restaurant.findOneAndUpdate({ name: "Shankar Idli Center" }, { $set: { categories: formatArr(shankarData, "category") } }, { new: true, upsert: true });
        console.log("Restored Shankar Idli");

        // 4. Restore Davanagere
        await Restaurant.findOneAndUpdate({ name: "Davanagere Bennedose Center" }, { $set: { categories: formatArr(davanagereData, "category") } }, { new: true, upsert: true });
        console.log("Restored Davanagere");

        // 5. Restore Khanavalis
        await Restaurant.findOneAndUpdate({ name: "Basaveshwar Lingayat Khanavali" }, { $set: { categories: formatArr(khanavaliData, "title") } }, { new: true, upsert: true });
        await Restaurant.findOneAndUpdate({ name: "Hundekar Khanavali" }, { $set: { categories: formatArr(khanavaliData, "title") } }, { new: true, upsert: true });
        await Restaurant.findOneAndUpdate({ name: "Prabhu Malabadi Khanavali" }, { $set: { categories: formatArr(khanavaliData, "title") } }, { new: true, upsert: true });
        console.log("Restored Khanavalis");

        console.log("FINAL RESTORATION COMPLETE");
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
