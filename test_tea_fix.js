const mongoose = require('mongoose');
require('dotenv').config();

async function fixTea() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Restaurant = require('./server/models/Restaurant');
        const r = await Restaurant.findOne({ name: /Malasa/i });
        if (!r) return;

        r.categories.forEach(cat => {
            cat.items.forEach(item => {
                if (item.name === 'Tea') {
                    item.image = 'test_tea.webp';
                }
            });
        });

        await r.save();
        console.log('Tea image path updated to test_tea.webp');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

fixTea();
