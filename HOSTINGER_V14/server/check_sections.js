const mongoose = require('mongoose');
const HomeDeliverySection = require('./models/HomeDeliverySection');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await HomeDeliverySection.countDocuments();
        console.log('HomeDeliverySection Count:', count);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
