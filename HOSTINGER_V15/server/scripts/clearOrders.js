const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const clearOrders = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('❌ MONGO_URI not found in .env');
            process.exit(1);
        }

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected');

        // Define a minimal Order schema just for deletion if model isn't available, 
        // OR better, assuming standard collection name 'orders'
        const collections = await mongoose.connection.db.listCollections().toArray();
        const orderCollection = collections.find(c => c.name === 'orders');

        if (orderCollection) {
            console.log('🗑️  Deleting all orders...');
            // Access the collection directly to delete everything
            const result = await mongoose.connection.db.collection('orders').deleteMany({});
            console.log(`✅ Success! Deleted ${result.deletedCount} orders.`);
        } else {
            console.log('⚠️  No active "orders" collection found.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
        process.exit(0);
    }
};

clearOrders();
