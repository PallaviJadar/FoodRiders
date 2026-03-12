const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const mobile = '8762037422';
        const pin = '2026';
        const fullName = 'Chandru Hallikeri';

        // Check if user exists
        let user = await User.findOne({ mobile });

        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin, salt);

        if (user) {
            console.log('User exists, updating to Admin...');
            user.role = 'admin';
            user.fullName = fullName;
            user.pin = hashedPin;
            user.isApproved = true;
            await user.save();
        } else {
            console.log('Creating new Admin...');
            user = new User({
                mobile,
                fullName,
                pin: hashedPin,
                role: 'admin',
                isApproved: true
            });
            await user.save();
        }

        console.log('Admin seeded successfully:');
        console.log('Mobile:', mobile);
        console.log('PIN:', pin);
        console.log('Role:', user.role);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seedAdmin();
