const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const fixSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const mobile = '9380801462';
        let user = await User.findOne({ mobile });

        if (!user) {
            console.log('User not found. Try registering first or check number.');
            process.exit(1);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('super123', salt);

        console.log(`Setting password AND pin to hashed 'super123' for ${mobile}`);
        user.role = 'super_admin';
        user.password = hashedPassword;
        user.pin = hashedPassword; // Set both to be sure
        user.isApproved = true;
        user.isVerified = true;

        await user.save();
        console.log('✅ Super Admin credentials updated successfully!');
        process.exit();
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

fixSuperAdmin();
