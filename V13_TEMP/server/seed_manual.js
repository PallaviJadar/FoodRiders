const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Restaurant = require('./models/Restaurant');

dotenv.config();

// MANUALLY EXTRACTED DATA TO ENSURE CORRECTNESS
const foodridersCafeData = {
    "classicPizza": [
        { name: "American Pizza", price: 149, image: "/images/restaurants/foodriders-cafe/American Pizza.png", description: "Delicious pizza with fresh toppings", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] },
        { name: "Mexican Pizza", price: 149, image: "/images/restaurants/foodriders-cafe/Mexican Pizza.png", description: "Delicious pizza with fresh toppings", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] },
        { name: "Panjabi Tashan", price: 149, image: "/images/restaurants/foodriders-cafe/Panjabi Tashan.png", description: "Delicious pizza with fresh toppings", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] },
        { name: "Schezwan Delight", price: 149, image: "/images/restaurants/foodriders-cafe/Schezwan Delight.png", description: "Delicious pizza with fresh toppings", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] },
        { name: "Paneer Tika Pizza", price: 149, image: "/images/restaurants/foodriders-cafe/Paneer Tika Pizza.png", description: "Delicious pizza with fresh toppings", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] },
        { name: "The Maya", price: 149, image: "/images/restaurants/foodriders-cafe/The Maya.png", description: "Delicious pizza with fresh toppings", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] },
        { name: "Margherita", price: 149, image: "/images/restaurants/foodriders-cafe/Margherita.png", description: "Classic cheese pizza", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] },
        { name: "Veg Delight", price: 149, image: "/images/restaurants/foodriders-cafe/Veg Delight.png", description: "Delicious pizza with fresh toppings", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] },
        { name: "Fungerchips", price: 149, image: "/images/restaurants/foodriders-cafe/Snacks & Beverages/Fingerchips.png", description: "Delicious pizza with fresh toppings", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] },
        { name: "Red Chilli Pasta", price: 149, image: "/images/restaurants/foodriders-cafe/Snacks & Beverages/Red Chilly Paasta.png", description: "Delicious pizza with fresh toppings", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] },
        { name: "Coffee (Bru)", price: 149, image: "/images/restaurants/foodriders-cafe/Snacks & Beverages/Coffee.png", description: "Delicious pizza with fresh toppings", sizes: [{ size: "Small", price: 149 }, { size: "Medium", price: 259 }, { size: "Large", price: 399 }] }
    ],
    "snacks": [
        { name: "Water", price: 40, image: "/images/restaurants/foodriders-cafe/Snacks & Beverages/Water.png" },
        { name: "Fingerchips", price: 40, image: "/images/restaurants/foodriders-cafe/Snacks & Beverages/Fingerchips.png" },
        { name: "Paasta", price: 40, image: "/images/restaurants/foodriders-cafe/Snacks & Beverages/Paasta.png" },
        { name: "Red Chilly Paasta", price: 40, image: "/images/restaurants/foodriders-cafe/Snacks & Beverages/Red Chilly Paasta.png" },
        { name: "Coffee", price: 40, image: "/images/restaurants/foodriders-cafe/Snacks & Beverages/Coffee.png" }
    ]
};

const dwarakaData = {
    "Hot Beverages": [
        { name: "BLACK TEA", price: 20, image: "/images/restaurants/dwaraka/hotbeverages/black tea.jpg" },
        { name: "SPECIAL TEA", price: 25, image: "/images/restaurants/dwaraka/hotbeverages/special tea.jpg" },
        { name: "LEMON TEA", price: 25, image: "/images/restaurants/dwaraka/hotbeverages/lemon tea.jpg" },
        { name: "GINGER TEA", price: 25, image: "/images/restaurants/dwaraka/hotbeverages/ginger tea.jpg" },
        { name: "FILTER COFFEE", price: 25, image: "/images/restaurants/dwaraka/hotbeverages/ginger tea.jpg" },
        { name: "BLACK COFFEE", price: 20, image: "/images/restaurants/dwaraka/hotbeverages/black cofee.jpg" },
        { name: "BOURNVITA", price: 25, image: "/images/restaurants/dwaraka/hotbeverages/bournvita.jpg" },
        { name: "MILK PLAIN", price: 25, image: "/images/restaurants/dwaraka/hotbeverages/milk plain.jpg" },
        { name: "BADAM MILK", price: 30, image: "/images/restaurants/dwaraka/hotbeverages/Badam milk.jpg" }
    ],
    "Breakfast South Indian": [
        { name: "IDLI", price: 22, image: "/images/restaurants/dwaraka/breakfast/idli.jpg", sizes: [{ size: "S", price: 22 }, { size: "P", price: 40 }] },
        { name: "IDLI VADA", price: 50, image: "/images/restaurants/dwaraka/breakfast/idli vada.jpg", sizes: [{ size: "S", price: 50 }, { size: "P", price: 60 }] },
        { name: "VADA", price: 35, image: "/images/restaurants/dwaraka/breakfast/Dahi vada.jpg", sizes: [{ size: "S", price: 35 }, { size: "P", price: 60 }] },
        { name: "UPPITU", price: 30, image: "/images/restaurants/dwaraka/breakfast/uppittu.jpg" },
        { name: "SHIRA", price: 35, image: "/images/restaurants/dwaraka/breakfast/Shira.jpg" },
        { name: "CHOW CHOW BATH", price: 60, image: "/images/restaurants/dwaraka/breakfast/Chow Chow bath.jpg" },
        { name: "KURMA PURI", price: 35, image: "/images/restaurants/dwaraka/breakfast/Kurma puri.jpg", sizes: [{ size: "S", price: 35 }, { size: "P", price: 60 }] },
        { name: "ALU PURI", price: 40, image: "/images/restaurants/dwaraka/breakfast/Aloo Poori.jpg", sizes: [{ size: "S", price: 40 }, { size: "P", price: 70 }] },
        { name: "DAHI VADA", price: 35, image: "/images/restaurants/dwaraka/breakfast/Dahi vada.jpg", sizes: [{ size: "S", price: 35 }, { size: "P", price: 65 }] },
        { name: "MOSAR AVALAKKI", price: 40, image: "/images/restaurants/dwaraka/breakfast/Avalakki.jpg" },
        { name: "PULAV", price: 60, image: "/images/restaurants/dwaraka/breakfast/Pulav.jpg" }
    ],
    "Dosa": [
        { name: "SADA DOSA", price: 50, image: "/images/restaurants/dwaraka/dosa/sada  dosa.jpg" },
        { name: "MASALA DOSA (GHEE PUDI)", price: 60, image: "/images/restaurants/dwaraka/dosa/butter masala dosa.jpg" },
        { name: "MYSORE MASALA DOSA", price: 85, image: "/images/restaurants/dwaraka/dosa/Mysore Masala Dosa.jpg" },
        { name: "BUTTER MASALA DOSA", price: 75, image: "/images/restaurants/dwaraka/dosa/butter masala dosa.jpg" },
        { name: "OPEN DOSA", price: 65, image: "/images/restaurants/dwaraka/dosa/open dosa.jpg" },
        { name: "SET DOSA", price: 65, image: "/images/restaurants/dwaraka/dosa/set dosa.jpg" },
        { name: "AKKI DOSA", price: 65, image: "/images/restaurants/dwaraka/dosa/akki dosa.jpg", sizes: [{ size: "S", price: 65 }, { size: "P", price: 65 }] },
        { name: "ONION UTTAPA", price: 35, image: "/images/restaurants/dwaraka/dosa/onion uttappa.jpg" },
        { name: "TOMATO OMLET", price: 70, image: "/images/restaurants/dwaraka/dosa/tomato omlet.jpg" },
        { name: "RAVA DOSA", price: 65, image: "/images/restaurants/dwaraka/dosa/rava dosa.jpg" },
        { name: "PANEER BUTTER MASALA DOSA", price: 85, image: "/images/restaurants/dwaraka/dosa/butter masala dosa.jpg" }
    ],
    "Combos": [
        { name: "DOSA/IDLI COMBO", price: 100, image: "/images/restaurants/dwaraka/combos/dosa_idli_combo.png" },
        { name: "DOSA COMBO", price: 120, image: "/images/restaurants/dwaraka/combos/dosa_combo.png" }
    ],
    "North Indian": [
        { name: "GREEN SALAD", price: 40, image: "/images/restaurants/dwaraka/salads/green_salad.png" },
        { name: "TOMATO SOUP", price: 75, image: "/images/restaurants/dwaraka/soups/tomato_soup.png" },
        { name: "VEG HOT AND SOUR SOUP", price: 75, image: "/images/restaurants/dwaraka/soups/hot_and_sour_soup.png" }
    ],
    "Paneer Starters": [
        { name: "PANEER TIKKKA", price: 220, image: "/images/restaurants/dwaraka/biryani/Paneer tikka biryani.jpg" },
        { name: "MALAI PANEER TIKKA", price: 220, image: "/images/restaurants/dwaraka/paneerstarters/MALAI PANEER TIKKA.jpg" },
        { name: "PANEER HARIYALI", price: 220, image: "/images/restaurants/dwaraka/paneerstarters/PANEER HARIYALI.jpg" },
        { name: "PANEER PAHADI", price: 210, image: "/images/restaurants/dwaraka/paneerstarters/PANEER PAHADI.jpg" },
        { name: "ACHARI PANEER", price: 210, image: "/images/restaurants/dwaraka/paneerstarters/ACHARI PANEER.jpg" },
        { name: "PANEER BANJARA TIKKA", price: 210, image: "/images/restaurants/dwaraka/paneerstarters/PANEER BANJARA TIKKA.jpg" },
        { name: "PANEER MANCHURIAN/ PANEER 65", price: 150, image: "/images/restaurants/dwaraka/chefspecial/PANNER MANCHURIAN.jpg" },
        { name: "PANEER CHILLY / PANEER PEPPER DRY", price: 150, image: "/images/Food/Dwaraka/Paneer Starters Chinese Style/paneer-chilly.jpeg" },
        { name: "PANEER SINGAPORI/ PANEER HONGKONG DRY", price: 165, image: "/images/Food/Dwaraka/Paneer Starters Chinese Style/paneer-singapore.jpeg" },
        { name: "PANEER SATTE", price: 180, image: "/images/restaurants/dwaraka/chefspecial/PANEER USTAM.jpg" },
        { name: "PANEER SPICY CORIANDER", price: 170, image: "/images/Food/Dwaraka/Paneer Starters Chinese Style/paneer-spicy-coriander.jpeg" }
    ],
    "Mushroom Starters": [
        { name: "MUSHROOM TIKKA", price: 220, image: "/images/restaurants/dwaraka/mushroomstarters/MUSHROOM TIKKA.jpg" },
        { name: "HARIYALI MUSHROOM", price: 230, image: "/images/restaurants/dwaraka/breakfast/Shira.jpg" },
        { name: "CHATPATI MUSHROOM", price: 220, image: "/images/restaurants/dwaraka/mushroomstarters/CHATPATI MASHROOM.jpg" },
        { name: "MUSHROOM MULTANI TIKKA", price: 250, image: "/images/restaurants/dwaraka/mushroomstarters/MUSHROOM MULTANI TIKKA.jpg" },
        { name: "MUSHROOM MANCHURIAN / MANCHURIAN 65", price: 160, image: "/images/restaurants/dwaraka/breakfast/Shira.jpg" },
        { name: "MUSHROOM CHILLY / MUSHROOM PEPPER DRY", price: 160, image: "/images/restaurants/dwaraka/breakfast/Shira.jpg" }
    ],
    "Veg Starters": [
        { name: "TANDOORI ALU", price: 210, image: "/images/restaurants/dwaraka/vegstarters/TANDOORI ALOO.jpg" },
        { name: "TANDOORI GOBI", price: 210, image: "/images/restaurants/dwaraka/vegstarters/TANDOORI GOBI.jpg" },
        { name: "BABY CORN TIKKA", price: 240, image: "/images/restaurants/dwaraka/vegstarters/BABY CORN TIKKA.jpg" },
        { name: "VEG SEEK KABAB", price: 250, image: "/images/restaurants/dwaraka/vegstarters/VEG SEEK KABAB.jpg" },
        { name: "VEG CRISPY", price: 130, image: "/images/restaurants/dwaraka/vegstarters/VEG CRISPY.jpg" },
        { name: "VEG BULLET", price: 140, image: "/images/restaurants/dwaraka/vegstarters/VEG BULLET.jpg" },
        { name: "VEG BALLS", price: 140, image: "/images/restaurants/dwaraka/vegstarters/VEG BOLLS.jpg" },
        { name: "VEG SPRING ROLL", price: 150, image: "/images/restaurants/dwaraka/vegstarters/VEG SPRING ROLLS.jpg" },
        { name: "ONION PAKODA", price: 35, image: "/images/restaurants/dwaraka/vegstarters/ONION PAKODA.jpg" },
        { name: "PALAK PAKODA", price: 35, image: "/images/restaurants/dwaraka/vegstarters/PALAK PAKODA.jpg" },
        { name: "HARABHARA KABAB", price: 170, image: "/images/restaurants/dwaraka/vegstarters/HARABHARA KABAB.jpg" },
        { name: "VEG MANCHURIAN", price: 85, image: "/images/Food/Dwaraka/Veg Starters/veg-manchurian.jpeg" },
        { name: "VEG 65", price: 80, image: "/images/Food/Dwaraka/Veg Starters/veg-65.jpeg" },
        { name: "VEG LOLIPOP (6 PIECES)", price: 160, image: "/images/restaurants/dwaraka/vegstarters/VEG LOLIPOP.jpg" }
    ],
    "Smoky Sizzlers": [
        { name: "PANEER SHASHLIK", price: 320, image: "/images/Food/Dwaraka/Smoky Sizzlers/paneer-shashlik.jpeg" },
        { name: "CHINESE SIZZLER", price: 340, image: "/images/Food/Dwaraka/Smoky Sizzlers/chinese-sizzler.jpeg" },
        { name: "SIZZLER PLATTER", price: 350, image: "/images/Food/Dwaraka/Smoky Sizzlers/sizzler-platter.jpeg" },
        { name: "VEG HOT PAN", price: 250, image: "/images/Food/Dwaraka/Smoky Sizzlers/veg-hot-pan.jpeg" },
        { name: "PANNER HOT PAN", price: 230, image: "/images/Food/Dwaraka/Smoky Sizzlers/panner-hot-pan.jpeg" }
    ],
    "Noodles": [
        { name: "AMERICAN CHOPSY", price: 120, image: "/images/restaurants/dwaraka/noodles/AMERICAN CHOPSY.jpg" },
        { name: "VEG HAKKA NOODLES", price: 120, image: "/images/restaurants/dwaraka/noodles/VEG HAKKA NOODLES.jpg" },
        { name: "VEG SCHEZWAN NOODLES", price: 130, image: "/images/restaurants/dwaraka/noodles/VEG SCHEZWAN NOODLES.jpg" },
        { name: "SINGAPORE NOODLES / HONGKONG NOODLES", price: 130, image: "/images/restaurants/dwaraka/noodles/SINGAPORE NOODLES+HONGKONG NOODLES.jpg" },
        { name: "BROWN FRY CHILLY NOODLES", price: 140, image: "/images/restaurants/dwaraka/breakfast/idli.jpg" }
    ],
    "Chef Special Curries": [
        { name: "PANEER TIKKA LABADAR", price: 220, image: "/images/restaurants/dwaraka/chefspecial/PANEER TIKKA LABADAR.jpg" },
        { name: "VEG BILAITI", price: 220, image: "/images/restaurants/dwaraka/vegstarters/VEG BULLET.jpg" },
        { name: "PANEER BARAMATI", price: 220, image: "/images/restaurants/dwaraka/chefspecial/PANEER BARAMATI.jpg" },
        { name: "VEG DEEWANI HANDI", price: 200, image: "/images/restaurants/dwaraka/chefspecial/VEG DEEWANI HANDI.jpg" },
        { name: "METHI CHAMAN", price: 170, image: "/images/restaurants/dwaraka/chefspecial/METHI CHAMAN.jpg" }
    ],
    "Rice": [
        { name: "MASALA RICE", price: 130, image: "/images/Food/Dwaraka/Rice/masala-rice.jpeg" },
        { name: "CURD RICE", price: 100, image: "/images/restaurants/dwaraka/rice/Curd Rice.jpg" },
        { name: "VEG FRIED RICE", price: 130, image: "/images/restaurants/dwaraka/chefspecial/FRIED RICE.jpg" },
        { name: "BURNT GARLIC FRIED RICE", price: 170, image: "/images/restaurants/dwaraka/rice/BURNT GARLIC FRIED RICE.jpg" },
        { name: "MUSHROOM FRIED RICE", price: 140, image: "/images/restaurants/dwaraka/chefspecial/FRIED RICE.jpg" },
        { name: "TRIPLE SCHEZWAN RICE", price: 190, image: "/images/restaurants/dwaraka/rice/TRIPLE SCHEZWAN RICE.jpg" },
        { name: "PANEER FRIED RICE", price: 140, image: "/images/restaurants/dwaraka/rice/Paneer Fried Rice.jpg" }
    ],
    "Biryani": [
        { name: "MUSHROOM BIRYANI", price: 150, image: "/images/restaurants/dwaraka/biryani/Mashroom Biriyani.jpg" },
        { name: "PANEER BIRYANI", price: 150, image: "/images/restaurants/dwaraka/biryani/Paneer Biriyani.jpg" },
        { name: "PANEER TIKKA BIRYANI", price: 160, image: "/images/restaurants/dwaraka/biryani/Paneer tikka biryani.jpg" },
        { name: "VEG BIRYANI", price: 135, image: "/images/restaurants/dwaraka/biryani/Veg biryani.jpg" },
        { name: "HYDERABADI BIRYANI", price: 160, image: "/images/restaurants/dwaraka/biryani/Hyderabadi biriyani.jpg" }
    ]
};

const arasGrandData = [
    { "title": "South Indian", "items": [{ "name": "Idli", "sizes": [{ "size": "S", "price": 25 }, { "size": "P", "price": 40 }], "image": "/images/restaurants/aras-grand/main/IDLI.jpg" }, { "name": "Idlivada", "sizes": [{ "size": "S", "price": 50 }, { "size": "P", "price": 65 }], "image": "/images/restaurants/aras-grand/main/IDLI VADA.jpg" }, { "name": "Menduvada", "sizes": [{ "size": "S", "price": 35 }, { "size": "P", "price": 60 }] }, { "name": "Sheera", "price": 35, "image": "/images/restaurants/aras-grand/main/SHEERA.jpg" }, { "name": "Uppit", "price": 30 }, { "name": "Dahivada", "sizes": [{ "size": "S", "price": 35 }, { "size": "P", "price": 65 }], "image": "/images/restaurants/aras-grand/main/DAHI VADA.jpg" }, { "name": "Puri Kurma", "sizes": [{ "size": "S", "price": 35 }, { "size": "P", "price": 60 }], "image": "/images/restaurants/aras-grand/main/PURI KURMA.jpg" }, { "name": "Palav", "price": 50, "image": "/images/restaurants/aras-grand/main/PALAV.jpg" }, { "name": "Mosaru Avalakki", "price": 40 }] },
    { "title": "Dosa Items", "items": [{ "name": "Sada Dosa", "price": 50, "image": "/images/restaurants/aras-grand/main/sada  dosa.jpg" }, { "name": "Masala Dosa", "price": 60, "image": "/images/restaurants/aras-grand/main/masala dosa.jpg" }, { "name": "Akki Dosa", "price": 65, "image": "/images/restaurants/aras-grand/main/AKKI DOSA.jpg" }, { "name": "Mysore Masala", "price": 85 }, { "name": "Palak Masala", "price": 75, "image": "/images/restaurants/aras-grand/main/PALAK MASALA.jpg" }, { "name": "Tomoto Omlet", "price": 80 }, { "name": "Onion Uttappa", "price": 65, "image": "/images/restaurants/aras-grand/main/onion uttappa.jpg" }, { "name": "Rava Masala Dosa", "price": 80 }, { "name": "Set Dosa", "price": 65 }, { "name": "Cheese Masala Dosa", "price": 100 }, { "name": "Paneer Masala Dosa", "price": 110 }, { "name": "Paper Masala Dosa", "price": 90 }] },
    { "title": "Hot Beverages", "items": [{ "name": "Tea", "price": 15 }, { "name": "Black Tea", "price": 15 }, { "name": "Special Tea", "price": 20 }, { "name": "Coffee", "price": 20 }, { "name": "Bournvita", "price": 25 }, { "name": "Hot Milk", "price": 20 }, { "name": "Black Coffee", "price": 15 }, { "name": "Ginger Tea", "price": 20 }, { "name": "Lemon Tea", "price": 20 }, { "name": "Badam Milk", "price": 30 }] },
    { "title": "Starters", "items": [{ "name": "Gobi Manchurian/65", "price": 100 }, { "name": "Gobi Chilly/Pepper dry", "price": 110 }, { "name": "Babycorn Manchurian/65", "price": 120 }, { "name": "Mushroom Manchurian/65", "price": 130 }, { "name": "Paneer Manchurian/65", "price": 150 }, { "name": "Veg Bullet", "price": 120 }, { "name": "Veg Crispy", "price": 130 }, { "name": "Veg Spring Roll", "price": 140, "image": "/images/restaurants/aras-grand/specials/Veg Spring Roll.jpeg" }, { "name": "Veg Momos", "price": 100, "image": "/images/restaurants/aras-grand/specials/Veg Momos.jpeg" }, { "name": "Paneer Popcorn", "price": 160, "image": "/images/restaurants/aras-grand/specials/Paneer Popcorn.jpeg" }] },
    { "title": "North Indian Dishes", "items": [{ "name": "Veg Kadai/Handi/Kolhapuri/Hydrabadi", "price": 160 }, { "name": "Paneer Kolhapuri/Kadai/Masala", "price": 180 }, { "name": "Paneer Butter Masala", "price": 190 }, { "name": "Kaju Masala", "price": 190 }, { "name": "Dal Fry/Tadka", "price": 120 }, { "name": "Veg Patiyala", "price": 200 }] },
    { "title": "Rice Specials", "items": [{ "name": "Veg Biriyani", "price": 135 }, { "name": "Paneer Biriyani", "price": 160 }, { "name": "Jeera Rice", "price": 110 }, { "name": "Ghee Rice", "price": 130 }, { "name": "Dal Kichdi", "price": 130 }, { "name": "Curd Rice", "price": 100 }] }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. FoodRiders Cafe (Object -> Array)
        const frCategories = Object.entries(foodridersCafeData).map(([key, items]) => ({
            name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            items: items.map(item => ({
                ...item,
                sizes: item.sizes || [],
                isAvailable: true
            }))
        }));

        await Restaurant.findOneAndUpdate(
            { name: "FoodRiders Cafe" },
            { $set: { categories: frCategories } },
            { new: true, upsert: true }
        );
        console.log("Updated FoodRiders Cafe");

        // 2. Dwaraka (Object -> Array)
        const dwarakaCategories = Object.entries(dwarakaData).map(([key, items]) => ({
            name: key,
            items: items.map(item => ({
                ...item,
                price: item.price || (item.sizes ? item.sizes[0].price : 0),
                sizes: item.sizes || [],
                isAvailable: true
            }))
        }));

        await Restaurant.findOneAndUpdate(
            { name: "Dwaraka Restaurant" },
            { $set: { categories: dwarakaCategories } },
            { new: true, upsert: true }
        );
        console.log("Updated Dwaraka Restaurant");

        // 3. Aras Grand (Array -> Array)
        const arasCategories = arasGrandData.map(section => ({
            name: section.title,
            items: section.items.map(item => ({
                ...item,
                price: item.price || (item.sizes ? item.sizes[0].price : 0),
                sizes: item.sizes || [],
                isAvailable: true
            }))
        }));

        await Restaurant.findOneAndUpdate(
            { name: "Aras Grand" },
            { $set: { categories: arasCategories } },
            { new: true, upsert: true }
        );
        console.log("Updated Aras Grand");

        console.log("Migration Complete");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
