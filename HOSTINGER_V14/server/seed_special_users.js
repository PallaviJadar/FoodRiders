const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function seedSpecialUsers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const salt = await bcrypt.genSalt(10);

        const { encrypt } = require('./utils/encryption');

        // 1. Admin User
        const adminMobile = "8762037422";
        const adminPin = "2026";
        const hashedAdminPin = await bcrypt.hash(adminPin, salt);
        const encryptedAdminPin = encrypt(adminPin);

        let admin = await User.findOne({ mobile: adminMobile });
        if (admin) {
            console.log('Updating existing Admin user...');
            admin.pin = hashedAdminPin;
            admin.role = 'admin';
            admin.isApproved = true;
            admin.fullName = 'System Admin';
            admin.encryptedPassword = encryptedAdminPin;
        } else {
            console.log('Creating new Admin user...');
            admin = new User({
                mobile: adminMobile,
                pin: hashedAdminPin,
                role: 'admin',
                isApproved: true,
                fullName: 'System Admin',
                encryptedPassword: encryptedAdminPin
            });
        }
        await admin.save();
        console.log(`✅ Admin User Ready: ${adminMobile} / ${adminPin}\n`);

        // 2. Rider User
        const riderMobile = "7353707384";
        const riderPin = "0000";
        const hashedRiderPin = await bcrypt.hash(riderPin, salt);
        const encryptedRiderPin = encrypt(riderPin);

        let rider = await User.findOne({ mobile: riderMobile });
        if (rider) {
            console.log('Updating existing Rider user...');
            rider.pin = hashedRiderPin;
            rider.role = 'delivery_partner';
            rider.isApproved = true;
            rider.fullName = 'Delivery Rider';
            rider.encryptedPassword = encryptedRiderPin;
        } else {
            console.log('Creating new Rider user...');
            rider = new User({
                mobile: riderMobile,
                pin: hashedRiderPin,
                role: 'delivery_partner',
                isApproved: true,
                fullName: 'Delivery Rider',
                encryptedPassword: encryptedRiderPin
            });
        }
        await rider.save();
        console.log(`✅ Rider User Ready: ${riderMobile} / ${riderPin}\n`);

        console.log('Seeding Complete.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedSpecialUsers();
