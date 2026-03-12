const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({});
        console.log('ALL USERS:', JSON.stringify(users.map(u => ({
            id: u._id,
            fullName: u.fullName,
            mobile: u.mobile,
            username: u.username,
            role: u.role,
            isApproved: u.isApproved
        })), null, 2));
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listUsers();
