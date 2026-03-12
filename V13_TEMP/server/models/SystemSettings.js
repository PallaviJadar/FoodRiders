const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    isCodEnabled: { type: Boolean, default: true },
    isUpiEnabled: { type: Boolean, default: true },
    isRazorpayEnabled: { type: Boolean, default: true },
    upiId: { type: String, default: 'foodriders@ybl' },
    upiName: { type: String, default: 'FoodRiders' },
    qrImageUrl: { type: String, default: '/images/QR.jpg.jpeg' },
    paymentPhone: { type: String, default: '9876543210' },
    autoCancelMinutes: { type: Number, default: 15 },

    // Billing & Fees
    platformFee: {
        enabled: { type: Boolean, default: true },
        amount: { type: Number, default: 5 }
    },
    packagingFee: {
        mode: { type: String, enum: ['fixed', 'per100'], default: 'fixed' },
        fixedAmount: { type: Number, default: 2 },
        per100Amount: { type: Number, default: 2 }
    },
    deliveryFee: {
        mode: { type: String, enum: ['flat', 'slabs'], default: 'slabs' },
        flatAmount: { type: Number, default: 30 },
        slabs: [{
            minKm: { type: Number, required: true },
            maxKm: { type: Number, required: true },
            charge: { type: Number, required: true }
        }]
    },

    // Tips
    tipsEnabled: { type: Boolean, default: true },
    tipPresets: { type: [Number], default: [10, 20, 30] },

    // Free Delivery
    freeDelivery: {
        firstOrderFree: { type: Boolean, default: true },
        minOrderValue: { type: Number, default: 300 }
    },

    // Notification Alerts
    notificationAlerts: {
        whatsappEnabled: { type: Boolean, default: true },
        smsEnabled: { type: Boolean, default: true },
        emailEnabled: { type: Boolean, default: true },
        adminPhone: { type: String, default: '' },
        backupPhone: { type: String, default: '' },
        adminEmail: { type: String, default: '' }
    },

    customCharges: [
        {
            name: { type: String, required: true },
            amount: { type: Number, required: true },
            enabled: { type: Boolean, default: true }
        }
    ],
    dashboardResetAt: { type: Date, default: new Date('2000-01-01') }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
