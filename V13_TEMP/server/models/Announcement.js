const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['New Shop Opening', 'Promotion / Offer', 'Birthday Wishes', 'Festival Wishes', 'General Notice'],
        required: true
    },
    title: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    linkedRestaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    interactions: [
        {
            userId: { type: String }, // Can be userId or deviceToken for guests
            userName: { type: String },
            message: { type: String },
            type: { type: String, default: 'wish' }, // 'wish', 'like', etc.
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
