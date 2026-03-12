const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const adminExists = await User.findOne({ username: 'admin' });
        if (adminExists) {
            console.log('Admin user already exists.');
            process.exit();
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new User({
            fullName: 'System Admin',
            username: 'admin',
            mobile: '0000000000',
            password: hashedPassword,
            role: 'admin',
            isApproved: true,
            isVerified: true
        });

        await admin.save();
        console.log('Admin user created successfully!');
        console.log('Username: admin');
        console.log('Password: admin123');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
