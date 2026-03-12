const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Restaurant = require('./models/Restaurant');

dotenv.config();

// Detailed Menu Data Migration
const restaurants = [
    {
        name: "FoodRiders Cafe",
        address: "Central Hub, Mahalingapura",
        rating: 4.5,
        deliveryTime: 30,
        image: "foodriders-cafe.jpg",
        categories: [
            {
                name: "Classic Pizza",
                items: [
                    { name: "American Pizza", price: 149, image: "/images/restaurants/foodriders-cafe/pizza/American Pizza.jpg", description: "Delicious pizza with fresh toppings", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] },
                    { name: "Mexican Pizza", price: 149, image: "/images/restaurants/foodriders-cafe/pizza/Mexican Pizza.jpg", description: "Delicious pizza with fresh toppings", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] },
                    { name: "Margherita", price: 149, image: "/images/restaurants/foodriders-cafe/pizza/Margherita.jpg", description: "Classic cheese pizza", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] }
                ]
            },
            {
                name: "Snacks",
                items: [
                    { name: "Fingerchips", price: 40, image: "/images/restaurants/foodriders-cafe/snacks/Fungerchips.jpg" },
                    { name: "Red Chilli Pasta", price: 40, image: "/images/restaurants/foodriders-cafe/snacks/Red chilli pasta.jpg" },
                    { name: "Coffee", price: 40, image: "/images/restaurants/foodriders-cafe/snacks/Coffee (Bru).jpg" }
                ]
            }
        ]
    },
    {
        name: "Dwaraka Restaurant",
        address: "Main Road, Mahalingapura",
        rating: 4.5,
        deliveryTime: 30,
        image: "dwaraka.jpg",
        categories: [
            {
                name: "Hot Beverages",
                items: [
                    { name: "Black Tea", price: 20, image: "/images/restaurants/dwaraka/hotbeverages/black tea.jpg" },
                    { name: "Coffee", price: 25, image: "/images/restaurants/dwaraka/hotbeverages/ginger tea.jpg" }
                ]
            },
            {
                name: "Breakfast South Indian",
                items: [
                    { name: "Idli", price: 22, image: "/images/restaurants/dwaraka/breakfast/idli.jpg", sizes: [{ size: "S", price: 22 }, { size: "P", price: 40 }] },
                    { name: "Idli Vada", price: 50, image: "/images/restaurants/dwaraka/breakfast/idli vada.jpg", sizes: [{ size: "S", price: 50 }, { size: "P", price: 60 }] },
                    { name: "Dosa", price: 50, image: "/images/restaurants/dwaraka/dosa/sada  dosa.jpg" }
                ]
            },
            {
                name: "Veg Starters",
                items: [
                    { name: "Veg Crispy", price: 130, image: "/images/restaurants/dwaraka/vegstarters/VEG CRISPY.jpg" },
                    { name: "Veg Manchurian", price: 85, image: "/images/Food/Dwaraka/Veg Starters/veg-manchurian.jpeg" }
                ]
            }
        ]
    },
    {
        name: "Aras Grand",
        address: "City Center, Mahalingapura",
        rating: 4.5,
        deliveryTime: 45,
        image: "aras.jpg",
        categories: [
            {
                name: "South Indian",
                items: [
                    { name: "Idli", price: 25, sizes: [{ size: "S", price: 25 }, { size: "P", price: 40 }], image: "/images/restaurants/aras-grand/main/IDLI.jpg" },
                    { name: "Menduvada", price: 35, sizes: [{ size: "S", price: 35 }, { size: "P", price: 60 }] }
                ]
            },
            {
                name: "Dosa Items",
                items: [
                    { name: "Masala Dosa", price: 60, image: "/images/restaurants/aras-grand/main/masala dosa.jpg" },
                    { name: "Set Dosa", price: 65 }
                ]
            }
        ]
    },
    { name: "Malasa Mangally Hotel", address: "Near Bus Stand, Mahalingapura", rating: 4.5, deliveryTime: 30, image: "malasa.jpg", categories: [] },
    { name: "Gokul Hotel", address: "Market Road, Mahalingapura", rating: 4.2, deliveryTime: 25, image: "gokul.jpg", categories: [] },
    { name: "Shankar Idli Center", address: "Gandhi Circle, Mahalingapura", rating: 4.8, deliveryTime: 20, image: "shankar.jpg", categories: [] },
    { name: "Dovanagere Bennedose Center", address: "College Road, Mahalingapura", rating: 4.6, deliveryTime: 35, image: "davanagere.jpg", categories: [] },
    { name: "Prabhu Malabadi Khanavali", address: "North Extension, Mahalingapura", rating: 4.4, deliveryTime: 40, image: "khanavali.jpg", categories: [] },
    { name: "Basaveshwar Lingayat Khanavali", address: "Temple Street, Mahalingapura", rating: 4.5, deliveryTime: 40, image: "khanavali2.jpg", categories: [] },
    { name: "Hundekar Khanavali", address: "Station Road, Mahalingapura", rating: 4.3, deliveryTime: 35, image: "khanavali3.jpg", categories: [] },
    { name: "Manish Restaurant", address: "Highway Side, Mahalingapura", rating: 4.1, deliveryTime: 50, image: "manish.jpg", categories: [] },
    { name: "U K Dhaba", address: "Ring Road, Mahalingapura", rating: 4.0, deliveryTime: 55, image: "dhaba.jpg", categories: [] },
    { name: "Hotel Nandini Deluxe", address: "Luxury Lane, Mahalingapura", rating: 4.7, deliveryTime: 45, image: "nandini.jpg", categories: [] },
    { name: "Cakewala Bakery", address: "Sweet Corner, Mahalingapura", rating: 4.9, deliveryTime: 25, image: "bakery.jpg", categories: [] }
];

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        for (const r of restaurants) {
            // Update if exists, insert if not
            const result = await Restaurant.findOneAndUpdate(
                { name: r.name },
                { $set: r },
                { upsert: true, new: true }
            );
            console.log(`Migrated/Updated: ${result.name} - Items: ${result.categories.length > 0 ? result.categories[0].items.length : 0}`);
        }

        console.log("Migration complete");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrate();
