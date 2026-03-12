const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedRider = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected');

        // Check if Rider exists
        let rider = await User.findOne({ mobile: '7777777777' });
        if (rider) {
            console.log('Rider already exists.');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPin = await bcrypt.hash('1234', salt);

            rider = new User({
                fullName: 'RiderOne',
                mobile: '7777777777',
                pin: hashedPin,
                password: hashedPin,
                role: 'delivery_partner',
                isApproved: true,
                isVerified: true
            });
            await rider.save();
            console.log('Rider Created: 7777777777 / 1234');
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedRider();
