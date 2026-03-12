const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // 1. Create Admin User
        const adminMobile = "9999999999";
        let admin = await User.findOne({ mobile: adminMobile });
        if (!admin) {
            admin = new User({
                fullName: "Super Admin",
                mobile: adminMobile,
                role: "admin",
                isApproved: true,
                deviceToken: "dummy"
            });
            await admin.save();
            console.log("Created Admin User");
        } else {
            console.log("Admin User exists");
            // Ensure role is admin
            if (admin.role !== 'admin') {
                admin.role = 'admin';
                await admin.save();
            }
        }

        // 2. Generate Token
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        console.log("TOKEN:", token);

        // 3. Create Dummy Restaurant
        const dummy = new Restaurant({
            name: "Delete Me Restaurant",
            address: "123 Test St",
            rating: 4.5,
            deliveryTime: 30,
            categories: [
                {
                    name: "Test Cat",
                    items: [
                        { name: "Test Item", price: 100, isAvailable: true }
                    ]
                }
            ]
        });
        const savedRes = await dummy.save();
        console.log("RESTAURANT_ID:", savedRes._id.toString());

        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
