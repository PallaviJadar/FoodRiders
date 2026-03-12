const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const seedSuperAdmin = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI not found in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const mobile = '9380801462'; // User's preferred number for owner
        const username = 'superadmin';

        let user = await User.findOne({ mobile });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('super123', salt);

        if (user) {
            console.log(`User with mobile ${mobile} exists. Promoting to super_admin...`);
            user.role = 'super_admin';
            user.password = hashedPassword;
            user.isApproved = true;
            user.isVerified = true;
            await user.save();
        } else {
            user = new User({
                fullName: 'Platform Owner',
                username: username,
                mobile: mobile,
                password: hashedPassword,
                role: 'super_admin',
                isApproved: true,
                isVerified: true
            });
            await user.save();
            console.log('Super Admin created successfully!');
        }

        console.log('---------------------------');
        console.log(`Role: super_admin`);
        console.log(`Mobile: ${mobile}`);
        console.log(`Password: super123 (Change this manually later)`);
        console.log('---------------------------');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedSuperAdmin();
