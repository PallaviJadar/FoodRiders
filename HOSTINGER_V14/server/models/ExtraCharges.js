const mongoose = require('mongoose');

const ExtraChargesSchema = new mongoose.Schema({
    systemEnabled: {
        type: Boolean,
        default: false
    },
    charges: [{
        id: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            default: '⚡'
        },
        description: {
            type: String,
            required: true
        },
        enabled: {
            type: Boolean,
            default: false
        },
        type: {
            type: String,
            enum: ['fixed', 'percentage'],
            default: 'fixed'
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        applyTo: {
            type: String,
            enum: ['delivery', 'all'],
            default: 'delivery'
        },
        timeRange: {
            start: String,
            end: String
        }
    }],
    lastModified: {
        by: String,
        at: Date,
        action: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ExtraCharges', ExtraChargesSchema);
