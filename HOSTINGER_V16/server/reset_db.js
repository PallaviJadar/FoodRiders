
const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');
require('dotenv').config();

const resetDb = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/foodriders', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected');

        // Clear Orders and Users
        await Order.deleteMany({});
        await User.deleteMany({});
        console.log('Orders and Users cleared.');

        // Create Admin
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash('1234', salt);

        const admin = new User({
            fullName: 'Super Admin',
            mobile: '9999999999',
            pin: hashedPin,
            password: hashedPin, // Legacy support
            role: 'admin',
            email: 'admin@foodriders.com'
        });
        await admin.save();
        console.log('Admin Created: 9999999999 / 1234');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetDb();
