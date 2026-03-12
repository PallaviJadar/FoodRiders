const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const resetAdmin = async () => {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const username = 'admin';
        const passwordPlain = 'admin123';

        let user = await User.findOne({ username });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordPlain, salt);

        if (user) {
            console.log("Admin user found. Updating password...");
            user.password = hashedPassword;
            user.role = 'admin'; // Ensure role is admin
            user.loginAttempts = 0;
            user.lockUntil = undefined;
            // Clear pin if it conflicts? No, logic checks pin||password. 
            // If user has pin, it checks pin. If user has password, it checks password.
            // Let's ensure pin is null or synced if we want 'admin123' to work as password.
            // The route logic: const hash = user.pin || user.password;
            // It prefers PIN if exists. So if admin has a PIN set, it might try to compare 'admin123' against PIN hash?
            // Actually, code says: `const hash = user.pin || user.password;`
            // If user.pin exists, it uses that for comparison.
            // If I want 'admin123' (string) to work, I should probably ensure the 'hash' used matches what bcrypt verifies.
            // If I set user.password, but user.pin exists, it uses user.pin.
            // So I should probably UNSET pin to force password usage, OR set PIN to same hash (but PIN usually 4 digits).
            // Safest: Unset PIN for username-based admin.
            user.pin = undefined;

            await user.save();
            console.log("Admin password updated.");
        } else {
            console.log("Admin user not found. Creating new...");
            user = new User({
                username,
                password: hashedPassword,
                role: 'admin',
                fullName: 'System Administrator',
                isApproved: true,
                mobile: '0000000000' // Dummy mobile to satisfy unique constraint if any? 
                // Actually User model might NOT enforce mobile unique if sparse, or maybe it does.
                // Let's check User model requirement. Most likely mobile is required/unique.
            });
            // Try to save. If mobile conflict, we handle it.
            // A fake mobile '0000000000' might aid login.
            try {
                await user.save();
                console.log("New Admin created.");
            } catch (e) {
                if (e.code === 11000) {
                    console.log("Duplicate key error (probably mobile). Checking if '0000000000' exists.");
                    // If mobile collision, find that user and promote to admin?
                    // Or just pick a different random mobile.
                    user.mobile = '9999999999';
                    await user.save();
                    console.log("New Admin created with fallback mobile.");
                } else {
                    throw e;
                }
            }
        }

        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
};

resetAdmin();
