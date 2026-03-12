const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
    referrerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    newUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING',
        index: true
    },
    referrerReward: {
        type: Number,
        default: 20
    },
    newUserReward: {
        type: Number,
        default: 20
    },
    deviceFingerprint: {
        type: String,
        index: true
    },
    ipAddress: {
        type: String
    },
    completedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Compound index to prevent duplicate referrals
ReferralSchema.index({ referrerId: 1, newUserId: 1 }, { unique: true });

module.exports = mongoose.model('Referral', ReferralSchema);
