const mongoose = require('mongoose');
require('dotenv').config();

async function addIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        const db = mongoose.connection.db;

        console.log('Adding indexes to Restaurants...');
        await db.collection('restaurants').createIndex({ displayOrder: -1, _id: 1 });
        await db.collection('restaurants').createIndex({ isActive: 1 });

        console.log('Adding indexes to Orders...');
        await db.collection('orders').createIndex({ createdAt: -1 });
        await db.collection('orders').createIndex({ isHiddenFromLive: 1, status: 1 });
        await db.collection('orders').createIndex({ restaurantName: 1 });

        console.log('🚀 All speed indexes created successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Index creation failed:', err);
        process.exit(1);
    }
}

addIndexes();
