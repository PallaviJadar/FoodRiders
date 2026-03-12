const mongoose = require('mongoose');

const popupSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    promoImage: { type: String }, // Renamed from image

    // Type & Behavior
    popupType: {
        type: String,
        enum: ['affiliate', 'menu_offer', 'general'],
        default: 'general'
    },
    displayMode: {
        type: String,
        enum: ['every_refresh', 'once_per_session', 'once_per_day'],
        default: 'every_refresh'
    },
    displayPriority: { type: Number, default: 5, min: 1, max: 10 },
    autoCloseSeconds: { type: Number, default: 10 },
    allowManualClose: { type: Boolean, default: true },

    // Action Buttons
    ctaText: { type: String },
    ctaLink: { type: String },
    phoneNumber: { type: String },
    whatsappNumber: { type: String },
    websiteUrl: { type: String },

    // Targeting
    townTarget: { type: String },
    festivalTag: { type: String },

    // Scheduling
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },

    // Stats
    clickCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
}, { timestamps: true });

// Ensure we can easily find the active one
popupSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Popup', popupSchema);
