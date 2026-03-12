const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const CategoryGroup = require('./models/CategoryGroup');
const HomeDeliverySection = require('./models/HomeDeliverySection');

dotenv.config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const uploadsPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);

        // Copy high-fidelity delivery boy images to uploads
        const boy1Src = path.join(__dirname, '../public/images/Delivery boy1 design.png');
        const boy2Src = path.join(__dirname, '../public/images/Delivery boy 2 design.png');

        const boy1Target = 'boy1_delivery.png';
        const boy2Target = 'boy2_delivery.png';

        if (fs.existsSync(boy1Src)) {
            fs.copyFileSync(boy1Src, path.join(uploadsPath, boy1Target));
            console.log('Copied Boy 1 to uploads');
        }
        if (fs.existsSync(boy2Src)) {
            fs.copyFileSync(boy2Src, path.join(uploadsPath, boy2Target));
            console.log('Copied Boy 2 to uploads');
        }

        // 1. Find or create Category Groups
        let foodGroup = await CategoryGroup.findOne({ name: 'Food Options' });
        if (foodGroup) await CategoryGroup.deleteOne({ _id: foodGroup._id });

        foodGroup = await CategoryGroup.create({
            name: 'Food Options',
            categories: [
                { name: 'Pure Veg', image: 'homestyle.png' },
                { name: 'Non Veg', image: 'chicken.png' }
            ]
        });

        let groceryGroup = await CategoryGroup.findOne({ name: 'Daily Essentials' });
        if (groceryGroup) await CategoryGroup.deleteOne({ _id: groceryGroup._id });

        groceryGroup = await CategoryGroup.create({
            name: 'Daily Essentials',
            categories: [
                { name: 'Grocery', image: 'homestyle.png' },
            ]
        });

        // 2. Clear and Rebuild Sections with correct images
        await HomeDeliverySection.deleteMany({});

        await HomeDeliverySection.create({
            title: 'Order Food',
            image: boy1Target,
            categoryGroupId: foodGroup._id,
            displayOrder: 1,
            isActive: true
        });

        await HomeDeliverySection.create({
            title: 'Grocery Delivery',
            image: boy2Target,
            categoryGroupId: groceryGroup._id,
            displayOrder: 2,
            isActive: true
        });

        console.log('Seeded Category Groups and Home Sections: Boy 1 (Veg/Non-Veg), Boy 2 (Grocery)');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
