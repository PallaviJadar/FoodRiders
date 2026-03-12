const mongoose = require('mongoose');

const CarouselItemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String, // Filename in uploads
        required: true
    },
    redirectType: {
        type: String,
        enum: ['restaurant', 'category', 'menu_item', 'offer', 'external'],
        required: true
    },
    redirectTarget: {
        type: String, // id (restaurant/menu/offer), slug (category), or URL (external)
        required: true
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Active', 'Hidden'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('CarouselItem', CarouselItemSchema);
