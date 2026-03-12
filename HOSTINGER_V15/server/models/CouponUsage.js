const mongoose = require('mongoose');

const CouponUsageSchema = new mongoose.Schema({
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    discountAmount: {
        type: Number,
        required: true
    },
    orderAmount: {
        type: Number,
        required: true
    }
}, { timestamps: true });

// Compound index for efficient user-coupon queries
CouponUsageSchema.index({ userId: 1, couponId: 1 });

module.exports = mongoose.model('CouponUsage', CouponUsageSchema);
