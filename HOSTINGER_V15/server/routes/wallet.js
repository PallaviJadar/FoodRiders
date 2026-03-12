const express = require('express');
const router = express.Router();
const WalletTransaction = require('../models/WalletTransaction');
const ReferralSettings = require('../models/ReferralSettings');
const { userAuth } = require('../middleware/auth');

// GET /api/wallet/balance - Get user's current wallet balance
router.get('/balance', userAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Expire old transactions first (lazy expiry)
        await WalletTransaction.expireOldTransactions(userId);

        // Get active balance
        const activeBalance = await WalletTransaction.getActiveBalance(userId);

        // Get expiring soon transactions (within 7 days)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const expiringSoon = await WalletTransaction.find({
            userId,
            status: { $in: ['ACTIVE', 'PARTIALLY_USED'] },
            expiryDate: {
                $gt: new Date(),
                $lte: sevenDaysFromNow
            }
        }).sort({ expiryDate: 1 }).limit(1);

        let expiryWarning = null;
        if (expiringSoon.length > 0) {
            const daysUntilExpiry = Math.ceil((expiringSoon[0].expiryDate - new Date()) / (1000 * 60 * 60 * 24));
            expiryWarning = {
                amount: expiringSoon[0].remainingAmount,
                daysLeft: daysUntilExpiry,
                expiryDate: expiringSoon[0].expiryDate
            };
        }

        res.json({
            success: true,
            data: {
                balance: activeBalance,
                expiryWarning
            }
        });

    } catch (error) {
        console.error('Wallet balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching wallet balance'
        });
    }
});

// GET /api/wallet/history - Get user's wallet transaction history
router.get('/history', userAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const skip = (page - 1) * limit;

        const transactions = await WalletTransaction.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await WalletTransaction.countDocuments({ userId });

        const formattedTransactions = transactions.map(txn => ({
            id: txn._id,
            amount: txn.amount,
            type: txn.type,
            source: txn.source,
            description: txn.description || getDefaultDescription(txn),
            status: txn.status,
            creditedDate: txn.creditedDate,
            expiryDate: txn.expiryDate,
            remainingAmount: txn.remainingAmount,
            createdAt: txn.createdAt
        }));

        res.json({
            success: true,
            data: {
                transactions: formattedTransactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Wallet history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching wallet history'
        });
    }
});

// GET /api/wallet/expiry-settings - Get wallet expiry configuration
router.get('/expiry-settings', async (req, res) => {
    try {
        const settings = await ReferralSettings.findOne();

        res.json({
            success: true,
            data: {
                expiryEnabled: settings?.walletExpiryEnabled || true,
                expiryDays: settings?.walletExpiryDays || 30
            }
        });

    } catch (error) {
        console.error('Expiry settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expiry settings'
        });
    }
});

// Helper function to generate default description
function getDefaultDescription(transaction) {
    switch (transaction.source) {
        case 'REFERRAL':
            return transaction.type === 'CREDIT'
                ? 'Referral reward credited'
                : 'Used in order';
        case 'ADMIN':
            return 'Admin credit';
        case 'PROMO':
            return 'Promotional credit';
        case 'ORDER_REFUND':
            return 'Order refund';
        default:
            return transaction.type === 'CREDIT' ? 'Wallet credited' : 'Wallet debited';
    }
}

module.exports = router;
