const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const CarouselItem = require('./models/CarouselItem');
const Announcement = require('./models/Announcement');

dotenv.config();

const carouselData = [
    { title: 'Pizza', image: 'pizza.png', linkType: 'Category', linkTarget: 'Pizza', order: 1 },
    { title: 'Biryani', image: 'biryaniC.png', linkType: 'Category', linkTarget: 'Biryani', order: 2 },
    { title: 'Burgers', image: 'burger.png', linkType: 'Category', linkTarget: 'Burger', order: 3 },
    { title: 'Chinese', image: 'noodels.png', linkType: 'Category', linkTarget: 'Chinese', order: 4 },
    { title: 'Bakery', image: 'homestyle.png', linkType: 'Restaurant', linkTarget: 'Cakewala Bakery', order: 5 },
    { title: 'Dosa', image: 'homestyle.png', linkType: 'Category', linkTarget: 'Dosa', order: 6 },
    { title: 'South Indian', image: 'homestyle.png', linkType: 'Category', linkTarget: 'South Indian', order: 7 }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Copy images from public to uploads to ensure they display
        const publicPath = path.join(__dirname, '../public/icons/Food');
        const uploadsPath = path.join(__dirname, 'uploads');

        if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);

        const files = fs.readdirSync(publicPath);
        files.forEach(file => {
            fs.copyFileSync(path.join(publicPath, file), path.join(uploadsPath, file));
        });
        console.log('Copied images to uploads');

        // Remove existing and add new
        await CarouselItem.deleteMany({});
        for (const item of carouselData) {
            await CarouselItem.create({
                title: item.title,
                image: item.image,
                linkType: item.linkType,
                linkTarget: item.linkTarget,
                displayOrder: item.order,
                status: 'Active'
            });
        }
        console.log('Seeded Carousel Items');

        // Add a sample announcement if none exist
        const count = await Announcement.countDocuments();
        if (count === 0) {
            await Announcement.create({
                type: 'Promotion / Offer',
                title: '50% OFF on First Order!',
                description: 'Use code WELCOME50 to get amazing discounts on your first meal with FoodRiders.',
                image: 'pizza.png',
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                isActive: true
            });
            console.log('Seeded Sample Announcement');
        }

        await mongoose.disconnect();
        console.log('Done');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
