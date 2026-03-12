const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const approveAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/food_riders');
        console.log('Connected to MongoDB');

        const result = await User.updateOne(
            { username: 'admin' },
            { $set: { isApproved: true, isVerified: true } }
        );

        if (result.matchedCount > 0) {
            console.log('Admin user approved successfully');
        } else {
            console.log('Admin user not found');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error approving admin:', error);
        process.exit(1);
    }
};

approveAdmin();
