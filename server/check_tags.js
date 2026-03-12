const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const rs = await Restaurant.find({}, 'name tags');
        console.log('Unique Tags found:', [...new Set(rs.flatMap(r => r.tags))]);
        console.log('Sample Restaurants:', rs.map(r => ({ name: r.name, tags: r.tags })));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
