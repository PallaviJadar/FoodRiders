const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    type: {
        type: String,
        enum: ['FLAT', 'PERCENTAGE'],
        required: true
    },
    value: {
        type: Number,
        required: true,
        min: 0
    },
    minOrderAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    maxDiscount: {
        type: Number,
        default: null // Only for percentage type
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    validTill: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        default: null // null = unlimited
    },
    perUserLimit: {
        type: Number,
        default: 1
    },
    applicableRestaurantIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
    }],
    firstOrderOnly: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    timesUsed: {
        type: Number,
        default: 0
    },
    totalDiscountGiven: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Index for efficient querying
CouponSchema.index({ isActive: 1, validFrom: 1, validTill: 1 });

module.exports = mongoose.model('Coupon', CouponSchema);
