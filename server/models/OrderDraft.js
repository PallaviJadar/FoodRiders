const mongoose = require('mongoose');

const OrderDraftSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    orderData: { type: Object, required: true },
    razorpay_order_id: { type: String, index: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 } // Auto-delete after 1 hour
});

module.exports = mongoose.model('OrderDraft', OrderDraftSchema);
