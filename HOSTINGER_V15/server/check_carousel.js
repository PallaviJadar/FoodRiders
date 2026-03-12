const mongoose = require('mongoose');
const CarouselItem = require('./models/CarouselItem');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await CarouselItem.countDocuments();
        console.log('CarouselItem Count:', count);
        if (count > 0) {
            const items = await CarouselItem.find();
            console.log('Items:', JSON.stringify(items, null, 2));
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
