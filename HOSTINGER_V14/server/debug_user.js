const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ mobile: '8762037422' });
        if (!user) {
            console.log('USER NOT FOUND');
        } else {
            console.log('--- USER DATA ---');
            console.log('ID:', user._id);
            console.log('Role:', user.role);
            console.log('Is Approved:', user.isApproved);
            console.log('Is Blocked:', user.isBlocked);
            console.log('PIN Hash (user.pin):', user.pin);
            console.log('Password Hash (user.password):', user.password);
            console.log('-----------------');
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkUser();
