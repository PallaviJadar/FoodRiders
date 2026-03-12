const mongoose = require('mongoose');

const HomeDeliverySectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String, // Filename in uploads
        required: true
    },
    categoryGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CategoryGroup',
        required: true
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('HomeDeliverySection', HomeDeliverySectionSchema);
