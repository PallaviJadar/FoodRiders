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

        // 1. Update Daily Essentials Group to use Grocery/Bakery (Common 2-option split)
        let groceryGroup = await CategoryGroup.findOne({ name: 'Daily Essentials' });
        if (groceryGroup) {
            groceryGroup.categories = [
                { name: 'Grocery', image: 'homestyle.png' },
                { name: 'Cakes & Bakery', image: 'homestyle.png' }
            ];
            await groceryGroup.save();
            console.log('Updated Daily Essentials Group with Grocery/Bakery');
        }

        // 2. Tag Cakewala Bakery so it appears in discovery
        await Restaurant.updateMany({ name: "Cakewala Bakery" }, { $addToSet: { tags: 'Cakes & Bakery' } });

        // Note: For 'Grocery', there might not be a specific restaurant seeded yet, 
        // but this restores the categorical structure as requested.

        console.log('Tagged restaurants for Grocery Discovery');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
