const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    fingerprint: { type: String, required: true },
    date: { type: Date, required: true }, // Format: YYYY-MM-DD (start of day)
}, { timestamps: true });

// Ensure one entry per user per day
visitorSchema.index({ fingerprint: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Visitor', visitorSchema);
