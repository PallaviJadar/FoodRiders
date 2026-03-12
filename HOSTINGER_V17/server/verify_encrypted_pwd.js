const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function verifyUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ mobile: { $in: ["8762037422", "7353707384"] } }).select('+encryptedPassword');

        console.log('=== User Verification ===');
        users.forEach(u => {
            console.log(`Mobile: ${u.mobile} | Role: ${u.role} | Encrypted Pwd: ${u.encryptedPassword ? 'PRESENT' : 'MISSING'}`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
verifyUsers();
