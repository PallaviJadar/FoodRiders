const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const User = require('../models/User');
const Order = require('../models/Order');
const WalletTransaction = require('../models/WalletTransaction');
const { adminAuth } = require('../middleware/auth');

// ============================================
// REFERRAL ANALYTICS
// ============================================

// GET /api/analytics/referrals
router.get('/referrals', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate, filter } = req.query;

        // Calculate date range
        let dateFilter = {};
        const now = new Date();

        if (filter === 'today') {
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            dateFilter = { createdAt: { $gte: startOfDay } };
        } else if (filter === 'week') {
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            dateFilter = { createdAt: { $gte: weekAgo } };
        } else if (filter === 'month') {
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            dateFilter = { createdAt: { $gte: monthAgo } };
        } else if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        // Total referral codes generated (unique users with referral codes)
        const totalCodesGenerated = await User.countDocuments({ referralCode: { $exists: true, $ne: null } });

        // Total referral attempts
        const totalAttempts = await Referral.countDocuments(dateFilter);

        // Successful referrals (completed)
        const successfulReferrals = await Referral.countDocuments({
            ...dateFilter,
            status: 'COMPLETED'
        });

        // Failed/Invalid referrals
        const failedReferrals = totalAttempts - successfulReferrals;

        // Total wallet credit given
        const walletCreditResult = await WalletTransaction.aggregate([
            {
                $match: {
                    source: 'REFERRAL',
                    type: 'CREDIT',
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: null,
                    totalCredit: { $sum: '$amount' }
                }
            }
        ]);

        const totalWalletCredit = walletCreditResult.length > 0 ? walletCreditResult[0].totalCredit : 0;

        // Top 5 referrers
        const topReferrers = await Referral.aggregate([
            {
                $match: {
                    status: 'COMPLETED',
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: '$referrerId',
                    totalReferrals: { $sum: 1 },
                    totalReward: { $sum: '$referrerReward' }
                }
            },
            {
                $sort: { totalReferrals: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    mobile: '$user.mobile',
                    fullName: '$user.fullName',
                    totalReferrals: 1,
                    totalReward: 1
                }
            }
        ]);

        // Recent referral records
        const recentReferrals = await Referral.find(dateFilter)
            .populate('referrerId', 'mobile fullName')
            .populate('newUserId', 'mobile fullName')
            .populate('orderId', '_id orderNumber')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const referralRecords = recentReferrals.map(ref => ({
            referrerMobile: ref.referrerId?.mobile || 'N/A',
            referrerName: ref.referrerId?.fullName || 'N/A',
            referredMobile: ref.newUserId?.mobile || 'N/A',
            referredName: ref.newUserId?.fullName || 'N/A',
            orderId: ref.orderId?._id || null,
            orderNumber: ref.orderId?.orderNumber || 'N/A',
            rewardAmount: ref.referrerReward + ref.newUserReward,
            status: ref.status,
            date: ref.createdAt
        }));

        res.json({
            success: true,
            data: {
                metrics: {
                    totalCodesGenerated,
                    totalAttempts,
                    successfulReferrals,
                    failedReferrals,
                    totalWalletCredit
                },
                topReferrers,
                referralRecords
            }
        });

    } catch (error) {
        console.error('Referral analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching referral analytics'
        });
    }
});

// ============================================
// COUPON ANALYTICS
// ============================================

// GET /api/analytics/coupons
router.get('/coupons', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate, restaurantId } = req.query;

        // Build date filter
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                usedAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        // Get all coupons
        let couponFilter = {};
        if (restaurantId) {
            couponFilter = {
                $or: [
                    { applicableRestaurantIds: [] },
                    { applicableRestaurantIds: restaurantId }
                ]
            };
        }

        const coupons = await Coupon.find(couponFilter).lean();

        // Get coupon performance data
        const couponPerformance = await Promise.all(coupons.map(async (coupon) => {
            // Times applied (validation attempts)
            const timesApplied = await CouponUsage.countDocuments({
                couponId: coupon._id,
                ...dateFilter
            });

            // Successful uses (actually used in orders)
            const successfulUses = await CouponUsage.countDocuments({
                couponId: coupon._id,
                status: 'USED',
                ...dateFilter
            });

            // Failed attempts
            const failedAttempts = timesApplied - successfulUses;

            // Total discount given
            const discountResult = await CouponUsage.aggregate([
                {
                    $match: {
                        couponId: coupon._id,
                        status: 'USED',
                        ...dateFilter
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalDiscount: { $sum: '$discountAmount' },
                        avgOrderValue: { $avg: '$orderAmount' }
                    }
                }
            ]);

            const totalDiscount = discountResult.length > 0 ? discountResult[0].totalDiscount : 0;
            const avgOrderValue = discountResult.length > 0 ? discountResult[0].avgOrderValue : 0;

            // Conversion rate
            const conversionRate = timesApplied > 0 ? ((successfulUses / timesApplied) * 100).toFixed(2) : 0;

            // Status
            let status = 'ACTIVE';
            if (!coupon.isActive) {
                status = 'DISABLED';
            } else if (new Date() > new Date(coupon.validTill)) {
                status = 'EXPIRED';
            }

            return {
                couponId: coupon._id,
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                timesApplied,
                successfulUses,
                failedAttempts,
                totalDiscount,
                avgOrderValue: Math.round(avgOrderValue),
                conversionRate: parseFloat(conversionRate),
                status,
                validTill: coupon.validTill,
                isActive: coupon.isActive
            };
        }));

        // Sort by successful uses
        couponPerformance.sort((a, b) => b.successfulUses - a.successfulUses);

        res.json({
            success: true,
            data: {
                coupons: couponPerformance
            }
        });

    } catch (error) {
        console.error('Coupon analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching coupon analytics'
        });
    }
});

// ============================================
// WALLET ANALYTICS
// ============================================

// GET /api/analytics/wallet/summary
router.get('/wallet/summary', adminAuth, async (req, res) => {
    try {
        // Total wallet credits issued
        const totalCreditsResult = await WalletTransaction.aggregate([
            {
                $match: {
                    type: 'CREDIT'
                }
            },
            {
                $group: {
                    _id: null,
                    totalIssued: { $sum: '$amount' }
                }
            }
        ]);

        const totalCreditsIssued = totalCreditsResult.length > 0 ? totalCreditsResult[0].totalIssued : 0;

        // Total wallet credits used
        const totalUsedResult = await WalletTransaction.aggregate([
            {
                $match: {
                    type: 'DEBIT'
                }
            },
            {
                $group: {
                    _id: null,
                    totalUsed: { $sum: '$amount' }
                }
            }
        ]);

        const totalCreditsUsed = totalUsedResult.length > 0 ? totalUsedResult[0].totalUsed : 0;

        // Total expired credits
        const totalExpiredResult = await WalletTransaction.aggregate([
            {
                $match: {
                    status: 'EXPIRED'
                }
            },
            {
                $group: {
                    _id: null,
                    totalExpired: { $sum: '$amount' }
                }
            }
        ]);

        const totalExpired = totalExpiredResult.length > 0 ? totalExpiredResult[0].totalExpired : 0;

        // Active balance across all users
        const activeBalanceResult = await WalletTransaction.aggregate([
            {
                $match: {
                    status: { $in: ['ACTIVE', 'PARTIALLY_USED'] },
                    $or: [
                        { expiryDate: { $gt: new Date() } },
                        { expiryDate: null }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    totalActive: { $sum: '$remainingAmount' }
                }
            }
        ]);

        const totalActiveBalance = activeBalanceResult.length > 0 ? activeBalanceResult[0].totalActive : 0;

        res.json({
            success: true,
            data: {
                totalCreditsIssued,
                totalCreditsUsed,
                totalExpired,
                totalActiveBalance
            }
        });

    } catch (error) {
        console.error('Wallet analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching wallet analytics'
        });
    }
});

module.exports = router;
