const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Referral = require('../models/Referral');
const ReferralSettings = require('../models/ReferralSettings');
const Order = require('../models/Order');
const WalletTransaction = require('../models/WalletTransaction');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Admin middleware
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

// @route   POST /api/referrals/validate
// @desc    Validate referral code during signup
// @access  Public
router.post('/validate', async (req, res) => {
    try {
        const { referralCode } = req.body;

        if (!referralCode || !referralCode.trim()) {
            return res.json({
                success: false,
                message: 'Referral code is empty',
                valid: false
            });
        }

        const referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });

        if (!referrer) {
            return res.json({
                success: false,
                message: 'Invalid referral code',
                valid: false
            });
        }

        // Check if referrer has reached max referrals
        const settings = await ReferralSettings.findOne() || { maxReferralsPerUser: 10 };
        const referralCount = await Referral.countDocuments({
            referrerId: referrer._id,
            status: 'COMPLETED'
        });

        if (referralCount >= settings.maxReferralsPerUser) {
            return res.json({
                success: false,
                message: 'This referral code has reached its usage limit',
                valid: false
            });
        }

        res.json({
            success: true,
            message: `Valid! You'll get ₹${settings.newUserReward || 20} wallet credit on your first order`,
            valid: true,
            referrerName: referrer.fullName
        });
    } catch (err) {
        console.error('Referral validation error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            valid: false
        });
    }
});

// @route   POST /api/referrals/apply
// @desc    Apply referral reward after first successful order
// @access  Private (called internally after order completion)
router.post('/apply', async (req, res) => {
    try {
        const { userId, orderId, deviceFingerprint, ipAddress } = req.body;

        const user = await User.findById(userId);
        if (!user || !user.referredBy) {
            return res.json({ success: false, message: 'No referral to apply' });
        }

        // Check if this is truly the first order
        const previousOrders = await Order.countDocuments({
            userId: userId,
            status: { $in: ['DELIVERED', 'ORDER_ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'] },
            _id: { $ne: orderId }
        });

        if (previousOrders > 0) {
            return res.json({ success: false, message: 'Referral only valid for first order' });
        }

        // Check for device abuse
        if (deviceFingerprint) {
            const deviceUsed = await Referral.findOne({
                deviceFingerprint,
                status: 'COMPLETED'
            });
            if (deviceUsed) {
                return res.json({ success: false, message: 'Device already used for referral' });
            }
        }

        // Find referrer
        const referrer = await User.findOne({ referralCode: user.referredBy });
        if (!referrer) {
            return res.json({ success: false, message: 'Referrer not found' });
        }

        // Check if referral already exists
        const existingReferral = await Referral.findOne({
            referrerId: referrer._id,
            newUserId: user._id
        });

        if (existingReferral && existingReferral.status === 'COMPLETED') {
            return res.json({ success: false, message: 'Referral already applied' });
        }

        // Get settings
        const settings = await ReferralSettings.findOne() || {
            referrerReward: 20,
            newUserReward: 20,
            isEnabled: true,
            walletExpiryDays: 30
        };

        if (!settings.isEnabled) {
            return res.json({ success: false, message: 'Referral system is currently disabled' });
        }

        // Create or update referral
        let referral;
        if (existingReferral) {
            referral = existingReferral;
            referral.status = 'COMPLETED';
            referral.orderId = orderId;
            referral.deviceFingerprint = deviceFingerprint;
            referral.ipAddress = ipAddress;
            referral.completedAt = new Date();
            referral.referrerReward = settings.referrerReward;
            referral.newUserReward = settings.newUserReward;
        } else {
            referral = new Referral({
                referrerId: referrer._id,
                newUserId: user._id,
                orderId: orderId,
                status: 'COMPLETED',
                deviceFingerprint,
                ipAddress,
                referrerReward: settings.referrerReward,
                newUserReward: settings.newUserReward,
                completedAt: new Date()
            });
        }

        await referral.save();

        // Calculate Expiry Date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (settings.walletExpiryDays || 30));

        // Credit Referrer Wallet with Transaction Record
        const referrerTxn = new WalletTransaction({
            userId: referrer._id,
            amount: settings.referrerReward,
            type: 'CREDIT',
            source: 'REFERRAL',
            expiryDate: expiryDate,
            referralId: referral._id,
            description: `Referral reward for ${user.fullName}`,
            remainingAmount: settings.referrerReward,
            metadata: {
                referredMobile: user.mobile
            }
        });
        await referrerTxn.save();

        referrer.walletBalance = (referrer.walletBalance || 0) + settings.referrerReward;
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        await referrer.save();

        // Credit New User Wallet with Transaction Record
        // Check if New User already received signup bonus (Immediate Credit)
        const existingUserTxn = await WalletTransaction.findOne({
            referralId: referral._id,
            userId: user._id,
            type: 'CREDIT'
        });

        if (!existingUserTxn) {
            const newUserTxn = new WalletTransaction({
                userId: user._id,
                amount: settings.newUserReward,
                type: 'CREDIT',
                source: 'REFERRAL',
                expiryDate: expiryDate,
                referralId: referral._id,
                description: `Referral signup bonus`,
                remainingAmount: settings.newUserReward,
                metadata: {
                    referrerMobile: referrer.mobile
                }
            });
            await newUserTxn.save();

            user.walletBalance = (user.walletBalance || 0) + settings.newUserReward;
            await user.save();
        }

        // Update order
        await Order.findByIdAndUpdate(orderId, { referralApplied: true });

        res.json({
            success: true,
            message: `Referral applied! ₹${settings.newUserReward} credited to your wallet`,
            referrerReward: settings.referrerReward,
            newUserReward: settings.newUserReward
        });
    } catch (err) {
        console.error('Referral apply error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/referrals/user/stats (alias for my-stats)
router.get('/user/stats', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const referrals = await Referral.countDocuments({ referrerId: user._id, status: 'COMPLETED' });
        const totalEarned = await Referral.aggregate([
            { $match: { referrerId: user._id, status: 'COMPLETED' } },
            { $group: { _id: null, total: { $sum: '$referrerReward' } } }
        ]);

        res.json({
            success: true,
            data: {
                totalReferrals: referrals,
                totalEarned: totalEarned.length > 0 ? totalEarned[0].total : 0
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/referrals/settings
// @desc    Get referral settings (for display to users)
// @access  Public
router.get('/settings', async (req, res) => {
    try {
        let settings = await ReferralSettings.findOne();
        if (!settings) {
            settings = new ReferralSettings();
            await settings.save();
        }

        res.json({
            success: true,
            data: {
                referrerReward: settings.referrerReward,
                newUserReward: settings.newUserReward,
                isEnabled: settings.isEnabled,
                appLink: settings.appLink || 'https://www.foodriders.in'
            }
        });
    } catch (err) {
        console.error('Get referral settings error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/referrals/admin/settings
// @desc    Update referral settings
// @access  Admin only
router.put('/admin/settings', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { referrerReward, newUserReward, isEnabled, maxReferralsPerUser } = req.body;

        let settings = await ReferralSettings.findOne();
        if (!settings) {
            settings = new ReferralSettings();
        }

        if (referrerReward !== undefined) settings.referrerReward = referrerReward;
        if (newUserReward !== undefined) settings.newUserReward = newUserReward;
        if (isEnabled !== undefined) settings.isEnabled = isEnabled;
        if (maxReferralsPerUser !== undefined) settings.maxReferralsPerUser = maxReferralsPerUser;

        await settings.save();

        res.json({
            success: true,
            message: 'Referral settings updated',
            data: settings
        });
    } catch (err) {
        console.error('Update referral settings error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/referrals/admin/stats
// @desc    Get admin referral statistics
// @access  Admin only
router.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const totalReferrals = await Referral.countDocuments();
        const completedReferrals = await Referral.countDocuments({ status: 'COMPLETED' });
        const pendingReferrals = await Referral.countDocuments({ status: 'PENDING' });

        const completedReferralDocs = await Referral.find({ status: 'COMPLETED' });
        const totalWalletCredited = completedReferralDocs.reduce((sum, r) =>
            sum + (r.referrerReward || 0) + (r.newUserReward || 0), 0
        );

        const recentReferrals = await Referral.find()
            .populate('referrerId', 'fullName mobile')
            .populate('newUserId', 'fullName mobile')
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            data: {
                totalReferrals,
                completedReferrals,
                pendingReferrals,
                totalWalletCredited,
                recentReferrals: recentReferrals.map(r => ({
                    referrer: r.referrerId?.fullName || 'Unknown',
                    referrerMobile: r.referrerId?.mobile,
                    newUser: r.newUserId?.fullName || 'Unknown',
                    newUserMobile: r.newUserId?.mobile,
                    status: r.status,
                    referrerReward: r.referrerReward,
                    newUserReward: r.newUserReward,
                    date: r.completedAt || r.createdAt
                }))
            }
        });
    } catch (err) {
        console.error('Get admin referral stats error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
