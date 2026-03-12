const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    mobile: {
        type: String,
        required: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '5m' } // Mongoose TTL index (5 minutes)
    },
    verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Auto-delete after 5 minutes using expiresAt index
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', OtpSchema);
