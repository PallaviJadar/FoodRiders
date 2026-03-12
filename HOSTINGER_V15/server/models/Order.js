const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    userDetails: {
        name: String,
        address: String,
        phone: String,
        // Enhanced address fields
        recipientName: String,
        houseStreet: String,
        areaLandmark: String,
        townCity: String,
        pinCode: String,
        // Coordinates for delivery
        latitude: Number,
        longitude: Number,
        googleFormattedAddress: String,
        addressType: { type: String, enum: ['google_map', 'manual'], default: 'manual' }
    },
    items: [
        {
            id: String,
            name: String,
            price: Number,
            basePrice: Number,
            adjustmentApplied: {
                amount: Number,
                type: { type: String, enum: ['percentage', 'fixed'] }
            },
            quantity: Number,
            restaurant: String,
            image: String,
            size: String,
            category: String
        }
    ],
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
    },
    restaurantName: String,
    restaurantAddress: String,

    // ================================================
    // PRICING & FEES (All default to 0, never undefined)
    // ================================================
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    platformFee: { type: Number, default: 0 },
    packagingFee: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    tipAmount: { type: Number, default: 0 },
    walletAmountUsed: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    extraChargesTotal: { type: Number, default: 0 },

    customCharges: [
        { name: String, amount: { type: Number, default: 0 } }
    ],
    extraCharges: [
        {
            id: String,
            name: String,
            amount: { type: Number, default: 0 },
            type: { type: String, enum: ['fixed', 'percentage'] }
        }
    ],

    // ================================================
    // ORDER STATUS (Single Source of Truth - Step 1)
    // ================================================
    orderStatus: {
        type: String,
        enum: [
            "CREATED",
            "PAYMENT_PENDING",
            "USER_MARKED_PAID",
            "PAYMENT_CONFIRMED",
            "PENDING_ACCEPTANCE",
            "ACCEPTED",
            "PREPARING",
            "READY_FOR_PICKUP",
            "ASSIGNED",
            "PICKED_UP",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "CANCELLED"
        ],
        default: "CREATED",
        index: true
    },
    status: {
        type: String,
        default: 'PENDING_ACCEPTANCE'
    },

    // ================================================
    // PAYMENT (STRICT ARCHITECTURE)
    // ================================================
    paymentMethod: {
        type: String,
        enum: ['COD', 'RAZORPAY'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED'],
        default: 'PENDING'
    },
    paymentScreenshot: {
        type: String,
        default: null
    },
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,
    razorpay_refund_id: String,

    // ================================================
    // DELIVERY
    // ================================================
    deliveryBoyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    deliveryDistance: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    riderLocation: {
        lat: Number,
        lng: Number
    },
    shopLocation: {
        lat: Number,
        lng: Number
    },
    customerLocation: {
        lat: Number,
        lng: Number
    },

    // ================================================
    // OFFERS & DISCOUNTS
    // ================================================
    appliedCoupon: {
        code: String,
        type: String,
        value: Number,
        discountAmount: { type: Number, default: 0 }
    },
    referralApplied: { type: Boolean, default: false },
    appliedOffer: { type: String, default: null },
    freeDeliveryApplied: { type: Boolean, default: false },
    isFirstOrderBenefit: { type: Boolean, default: false },

    // ================================================
    // LIFECYCLE TIMESTAMPS
    // ================================================
    assignedAt: { type: Date },
    acceptedAt: { type: Date },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },

    // ================================================
    // TRACKING & ABUSE PREVENTION
    // ================================================
    deviceFingerprint: {
        type: String,
        default: null,
        index: true
    },
    addressHash: {
        type: String,
        default: null,
        index: true
    },

    // ================================================
    // ADDITIONAL INFO
    // ================================================
    order_notes: {
        type: String,
        maxlength: 150,
        default: null
    },
    scheduled_at: {
        type: Date,
        default: null
    },
    rejectReason: {
        type: String,
        default: null
    },
    messages: [
        {
            sender: String,
            senderName: String,
            senderImage: String,
            text: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],
    upiInstructionsSent: {
        type: Boolean,
        default: false
    },

    // ================================================
    // ADMIN CONTROLS
    // ================================================
    isHiddenFromLive: {
        type: Boolean,
        default: false,
        index: true
    },
    isAdminSeen: {
        type: Boolean,
        default: false,
        index: true
    },
    smsSent: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false,
        index: true
    },

    // ================================================
    // NOTIFICATION REMINDER FLAGS (Prevent duplicates)
    // ================================================
    acceptReminderSent: { type: Boolean, default: false },
    assignReminderSent: { type: Boolean, default: false },
    riderReminderSent: { type: Boolean, default: false },


    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
OrderSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Indexes for performance
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1, isHiddenFromLive: 1 });
OrderSchema.index({ deliveryBoyId: 1, orderStatus: 1 });

module.exports = mongoose.model('Order', OrderSchema);
