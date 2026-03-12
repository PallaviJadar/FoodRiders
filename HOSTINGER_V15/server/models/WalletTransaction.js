const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['CREDIT', 'DEBIT'],
        required: true
    },
    source: {
        type: String,
        enum: ['REFERRAL', 'ADMIN', 'PROMO', 'ORDER_REFUND'],
        required: true
    },
    creditedDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: function () {
            return this.type === 'CREDIT';
        }
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'EXPIRED', 'USED', 'PARTIALLY_USED'],
        default: 'ACTIVE'
    },
    remainingAmount: {
        type: Number,
        default: function () {
            return this.amount;
        }
    },
    referralId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Referral'
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    description: String,
    metadata: {
        referrerMobile: String,
        referredMobile: String,
        adminNote: String
    }
}, {
    timestamps: true
});

// Index for efficient queries
walletTransactionSchema.index({ userId: 1, status: 1, expiryDate: 1 });
walletTransactionSchema.index({ createdAt: -1 });

// Method to check if transaction is expired
walletTransactionSchema.methods.isExpired = function () {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate && this.status === 'ACTIVE';
};

// Static method to get user's active balance
walletTransactionSchema.statics.getActiveBalance = async function (userId) {
    const now = new Date();

    const result = await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                status: { $in: ['ACTIVE', 'PARTIALLY_USED'] },
                $or: [
                    { expiryDate: { $gt: now } },
                    { expiryDate: null }
                ]
            }
        },
        {
            $group: {
                _id: null,
                totalBalance: { $sum: '$remainingAmount' }
            }
        }
    ]);

    return result.length > 0 ? result[0].totalBalance : 0;
};

// Static method to expire old transactions
walletTransactionSchema.statics.expireOldTransactions = async function (userId) {
    const now = new Date();

    const result = await this.updateMany(
        {
            userId: new mongoose.Types.ObjectId(userId),
            status: { $in: ['ACTIVE', 'PARTIALLY_USED'] },
            expiryDate: { $lte: now }
        },
        {
            $set: { status: 'EXPIRED', remainingAmount: 0 }
        }
    );

    return result.modifiedCount;
};

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
