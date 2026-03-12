const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkPin() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ mobile: '8762037422' });
    if (!user) {
        console.log('USER NOT FOUND');
        process.exit();
    }
    const pinToTest = '0000';
    const isPinMatch = await bcrypt.compare(pinToTest, user.pin || '');
    const isPassMatch = await bcrypt.compare(pinToTest, user.password || '');

    console.log('PIN MATCH:', isPinMatch);
    console.log('PASSWORD MATCH:', isPassMatch);
    console.log('ROLE:', user.role);

    if (!isPinMatch) {
        console.log('Resetting PIN to 0000...');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(pinToTest, salt);
        user.pin = hash;
        user.password = hash;
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
        console.log('PIN reset successful.');
    }
    process.exit();
}
checkPin();
