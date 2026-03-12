// Initialize Referral and Coupon System
// Run this once to set up default settings

const mongoose = require('mongoose');
const ReferralSettings = require('./models/ReferralSettings');

const initializeSystem = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/foodriders');
        console.log('Connected to MongoDB');

        // Check if ReferralSettings exists
        let settings = await ReferralSettings.findOne();

        if (!settings) {
            // Create default settings
            settings = new ReferralSettings({
                referrerReward: 20,
                newUserReward: 20,
                maxReferralsPerUser: 10,
                isEnabled: true
            });
            await settings.save();
            console.log('✅ Created default referral settings');
        } else {
            console.log('✅ Referral settings already exist');
        }

        console.log('Settings:', settings);
        console.log('\n✅ System initialized successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

initializeSystem();
