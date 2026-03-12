const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function verifyUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ mobile: { $in: ["8762037422", "7353707384"] } });

        console.log('=== User Verification ===');
        users.forEach(u => {
            console.log(`Mobile: ${u.mobile} | Role: ${u.role} | Name: ${u.fullName}`);
        });
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}
verifyUsers();
