const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const User = require('../models/User');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

const { userAuth, adminAuth } = require('../middleware/auth');

// @route   POST /api/coupons/validate
// @desc    Validate coupon code for user
// @access  Private
router.post('/validate', userAuth, async (req, res) => {
    try {
        const { code, restaurantId, orderAmount } = req.body;

        if (!code || !code.trim()) {
            return res.json({
                success: false,
                message: 'Please enter a coupon code',
                valid: false
            });
        }

        const coupon = await Coupon.findOne({
            code: code.trim().toUpperCase(),
            isActive: true
        });

        if (!coupon) {
            return res.json({
                success: false,
                message: 'Invalid coupon code',
                valid: false
            });
        }

        // Check date validity
        const now = new Date();
        if (now < coupon.validFrom) {
            return res.json({
                success: false,
                message: `This coupon is valid from ${coupon.validFrom.toLocaleDateString()}`,
                valid: false
            });
        }

        if (now > coupon.validTill) {
            return res.json({
                success: false,
                message: 'This coupon has expired',
                valid: false
            });
        }

        // Check global usage limit
        if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
            return res.json({
                success: false,
                message: 'This coupon has reached its usage limit',
                valid: false
            });
        }

        // Check per-user usage limit
        const userUsageCount = await CouponUsage.countDocuments({
            couponId: coupon._id,
            userId: req.user.id
        });

        if (userUsageCount >= coupon.perUserLimit) {
            return res.json({
                success: false,
                message: `You have already used this coupon ${coupon.perUserLimit} time(s)`,
                valid: false
            });
        }

        // Check minimum order amount
        if (orderAmount < coupon.minOrderAmount) {
            return res.json({
                success: false,
                message: `Minimum order amount is ₹${coupon.minOrderAmount}`,
                valid: false
            });
        }

        // Check restaurant eligibility
        if (coupon.applicableRestaurantIds && coupon.applicableRestaurantIds.length > 0) {
            if (!coupon.applicableRestaurantIds.includes(restaurantId)) {
                return res.json({
                    success: false,
                    message: 'This coupon is not valid for this restaurant',
                    valid: false
                });
            }
        }

        // Check first order only rule
        if (coupon.firstOrderOnly) {
            const user = await User.findById(req.user.id);
            if (user.totalOrders > 0) {
                return res.json({
                    success: false,
                    message: 'This coupon is only valid for first orders',
                    valid: false
                });
            }
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.type === 'FLAT') {
            discountAmount = coupon.value;
        } else if (coupon.type === 'PERCENTAGE') {
            discountAmount = (orderAmount * coupon.value) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        }

        // Ensure discount doesn't exceed order amount
        if (discountAmount > orderAmount) {
            discountAmount = orderAmount;
        }

        res.json({
            success: true,
            message: `Coupon applied! You save ₹${discountAmount.toFixed(2)}`,
            valid: true,
            discount: discountAmount,
            couponDetails: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value
            }
        });
    } catch (err) {
        console.error('Coupon validation error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            valid: false
        });
    }
});

// @route   POST /api/coupons/apply
// @desc    Apply coupon to order (called during order creation)
// @access  Private (internal use)
router.post('/apply', async (req, res) => {
    try {
        const { couponCode, userId, orderId, orderAmount, discountAmount } = req.body;

        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (!coupon) {
            return res.json({ success: false, message: 'Coupon not found' });
        }

        // Record usage
        const usage = new CouponUsage({
            couponId: coupon._id,
            userId,
            orderId,
            discountAmount,
            orderAmount
        });
        await usage.save();

        // Update coupon stats
        coupon.timesUsed += 1;
        coupon.totalDiscountGiven += discountAmount;
        await coupon.save();

        res.json({
            success: true,
            message: 'Coupon applied successfully'
        });
    } catch (err) {
        console.error('Coupon apply error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============ ADMIN ROUTES ============

// @route   POST /api/coupons/admin/create
// @desc    Create new coupon
// @access  Admin only
router.post('/admin/create', userAuth, adminAuth, async (req, res) => {
    try {
        const {
            code,
            type,
            value,
            minOrderAmount,
            maxDiscount,
            validFrom,
            validTill,
            usageLimit,
            perUserLimit,
            applicableRestaurantIds,
            firstOrderOnly
        } = req.body;

        // Validation
        if (!code || !type || value === undefined || !validTill) {
            return res.status(400).json({
                success: false,
                message: 'Code, type, value, and valid till date are required'
            });
        }

        if (!['FLAT', 'PERCENTAGE'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be FLAT or PERCENTAGE'
            });
        }

        if (type === 'PERCENTAGE' && (value < 0 || value > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Percentage value must be between 0 and 100'
            });
        }

        // Check if code already exists
        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }

        const coupon = new Coupon({
            code: code.toUpperCase(),
            type,
            value,
            minOrderAmount: minOrderAmount || 0,
            maxDiscount: type === 'PERCENTAGE' ? maxDiscount : null,
            validFrom: validFrom || new Date(),
            validTill: new Date(validTill),
            usageLimit: usageLimit || null,
            perUserLimit: perUserLimit || 1,
            applicableRestaurantIds: applicableRestaurantIds || [],
            firstOrderOnly: firstOrderOnly || false,
            createdBy: req.user.id
        });

        await coupon.save();

        res.json({
            success: true,
            message: 'Coupon created successfully',
            data: coupon
        });
    } catch (err) {
        console.error('Create coupon error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/coupons/admin/list
// @desc    Get all coupons
// @access  Admin only
router.get('/admin/list', userAuth, adminAuth, async (req, res) => {
    try {
        const coupons = await Coupon.find()
            .sort({ createdAt: -1 })
            .populate('createdBy', 'fullName');

        res.json({
            success: true,
            data: coupons
        });
    } catch (err) {
        console.error('List coupons error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/coupons/admin/update/:id
// @desc    Update coupon
// @access  Admin only
router.put('/admin/update/:id', userAuth, adminAuth, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        const {
            type,
            value,
            minOrderAmount,
            maxDiscount,
            validFrom,
            validTill,
            usageLimit,
            perUserLimit,
            applicableRestaurantIds,
            firstOrderOnly,
            isActive
        } = req.body;

        if (type !== undefined) coupon.type = type;
        if (value !== undefined) coupon.value = value;
        if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
        if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
        if (validFrom !== undefined) coupon.validFrom = new Date(validFrom);
        if (validTill !== undefined) coupon.validTill = new Date(validTill);
        if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
        if (perUserLimit !== undefined) coupon.perUserLimit = perUserLimit;
        if (applicableRestaurantIds !== undefined) coupon.applicableRestaurantIds = applicableRestaurantIds;
        if (firstOrderOnly !== undefined) coupon.firstOrderOnly = firstOrderOnly;
        if (isActive !== undefined) coupon.isActive = isActive;

        await coupon.save();

        res.json({
            success: true,
            message: 'Coupon updated successfully',
            data: coupon
        });
    } catch (err) {
        console.error('Update coupon error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/coupons/admin/delete/:id
// @desc    Delete coupon
// @access  Admin only
router.delete('/admin/delete/:id', userAuth, adminAuth, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Check if coupon has been used
        const usageCount = await CouponUsage.countDocuments({ couponId: coupon._id });
        if (usageCount > 0) {
            // Don't delete, just deactivate
            coupon.isActive = false;
            await coupon.save();
            return res.json({
                success: true,
                message: 'Coupon has been deactivated (cannot delete used coupons)'
            });
        }

        await Coupon.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Coupon deleted successfully'
        });
    } catch (err) {
        console.error('Delete coupon error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/coupons/admin/toggle/:id
// @desc    Toggle coupon active status
// @access  Admin only
router.put('/admin/toggle/:id', userAuth, adminAuth, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        res.json({
            success: true,
            message: `Coupon ${coupon.isActive ? 'enabled' : 'disabled'} successfully`,
            data: coupon
        });
    } catch (err) {
        console.error('Toggle coupon error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/coupons/admin/stats
// @desc    Get coupon statistics
// @access  Admin only
router.get('/admin/stats', userAuth, adminAuth, async (req, res) => {
    try {
        const totalCoupons = await Coupon.countDocuments();
        const activeCoupons = await Coupon.countDocuments({ isActive: true });
        const totalUsage = await CouponUsage.countDocuments();

        const allCoupons = await Coupon.find();
        const totalDiscountGiven = allCoupons.reduce((sum, c) => sum + (c.totalDiscountGiven || 0), 0);

        res.json({
            success: true,
            data: {
                totalCoupons,
                activeCoupons,
                totalUsage,
                totalDiscountGiven
            }
        });
    } catch (err) {
        console.error('Get coupon stats error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
