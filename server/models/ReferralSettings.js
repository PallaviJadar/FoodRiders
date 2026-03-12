const mongoose = require('mongoose');

const ReferralSettingsSchema = new mongoose.Schema({
    referrerReward: {
        type: Number,
        default: 20,
        min: 0
    },
    newUserReward: {
        type: Number,
        default: 20,
        min: 0
    },
    isEnabled: {
        type: Boolean,
        default: true
    },
    maxReferralsPerUser: {
        type: Number,
        default: 10 // Limit to prevent abuse
    },
    // Wallet Expiry Settings
    walletExpiryEnabled: {
        type: Boolean,
        default: true
    },
    walletExpiryDays: {
        type: Number,
        default: 30,
        enum: [15, 30, 60, 90] // Allowed expiry durations
    },
    appLink: {
        type: String,
        default: 'https://www.foodriders.in' // For WhatsApp sharing
    }
}, { timestamps: true });

module.exports = mongoose.model('ReferralSettings', ReferralSettingsSchema);
