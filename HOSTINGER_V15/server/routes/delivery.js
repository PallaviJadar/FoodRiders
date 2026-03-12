const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const { updateOrderStatusInternal } = require('../controllers/orderStatusController');

// Delivery Partner Login
// Delivery Partner Login
router.post('/login', async (req, res) => {
    const { mobile, password, pin } = req.body;
    try {
        const user = await User.findOne({ mobile, role: { $in: ['delivery_partner', 'admin'] } });
        if (!user) return res.status(401).json({ msg: 'Delivery Partner not found' });

        if (user.isBlocked) return res.status(403).json({ msg: 'Account blocked' });

        // Lockout Check
        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(403).json({ msg: `Account locked. Try after ${Math.ceil((user.lockUntil - Date.now()) / 60000)} min` });
        }

        const secret = pin || password;
        if (!secret) return res.status(400).json({ msg: 'PIN or Password required' });

        const hash = user.pin || user.password;
        if (!hash) return res.status(500).json({ msg: 'Account corrupted. Contact Admin.' });

        const isMatch = await bcrypt.compare(secret, hash);
        if (!isMatch) {
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            if (user.loginAttempts >= 5) {
                user.lockUntil = Date.now() + 15 * 60 * 1000;
                await user.save();
                return res.status(403).json({ msg: 'Too many attempts. Locked for 15 mins.' });
            }
            await user.save();
            return res.status(401).json({ msg: 'Invalid credentials' });
        }

        // Success
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.fullName,
                mobile: user.mobile
            }
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Save FCM Token for Delivery Partner Push Notifications
router.post('/save-fcm-token', auth, async (req, res) => {
    try {
        if (!['delivery_partner', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ msg: 'Not a delivery partner' });
        }
        const { fcmToken } = req.body;
        if (!fcmToken) return res.status(400).json({ msg: 'FCM token required' });

        await User.findByIdAndUpdate(req.user.id, { deviceToken: fcmToken });
        console.log(`✅ [FCM] Rider token saved for ${req.user.id}: ${fcmToken.substring(0, 20)}...`);
        res.json({ success: true, msg: 'FCM token saved' });
    } catch (err) {
        console.error('[FCM] Rider save token error:', err);
        res.status(500).json({ msg: 'Failed to save FCM token' });
    }
});

// Verify Token (for protected route checks)
router.get('/verify', auth, async (req, res) => {
    if (!['delivery_partner', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ msg: 'Not a delivery partner' });
    }
    try {
        const user = await User.findById(req.user.id).select('-password -pin');
        if (!user || user.isBlocked) {
            return res.status(401).json({ msg: 'Invalid or blocked account' });
        }
        res.json({
            valid: true,
            user: {
                id: user._id,
                name: user.fullName,
                mobile: user.mobile
            }
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get assigned orders (active and history)
router.get('/orders', auth, async (req, res) => {
    if (!['delivery_partner', 'admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Access denied' });
    try {
        const orders = await Order.find({ deliveryBoyId: req.user.id }).sort({ createdAt: -1 });

        // Filter active vs history
        const active = orders.filter(o =>
            !['DELIVERED', 'CANCELLED'].includes(o.status)
        );

        const history = orders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status));

        res.json({ active, history });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get order detail (minimal info)
router.get('/orders/:id', auth, async (req, res) => {
    if (!['delivery_partner', 'admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Access denied' });
    try {
        const order = await Order.findOne({ _id: req.params.id, deliveryBoyId: req.user.id });
        if (!order) return res.status(404).json({ msg: 'Order not found or not assigned to you' });

        // Filter sensitive data & add required fields
        const minimalOrder = {
            _id: order._id,
            restaurantName: order.restaurantName,
            restaurantAddress: order.restaurantAddress,
            customerName: order.userDetails.name,
            deliveryAddress: order.userDetails.address,
            customerPhone: order.userDetails.phone,
            distance: order.deliveryDistance,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            status: order.status,
            totalAmount: order.totalAmount,
            order_notes: order.order_notes,
            createdAt: order.createdAt
        };
        res.json(minimalOrder);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Update Order Status
router.put('/orders/:id/status', auth, async (req, res) => {
    if (!['delivery_partner', 'admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Access denied' });
    let { status } = req.body;
    if (status) status = status.trim().toUpperCase();

    const validStatuses = ['READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'ACCEPTED', 'ARRIVING', 'ACCEPT'];
    if (!status || !validStatuses.includes(status)) {
        console.error(`[DELIVERY_API] Invalid status received: "${status}" for order ${req.params.id}`);
        return res.status(400).json({
            msg: 'Invalid status update',
            received: status,
            allowed: validStatuses
        });
    }

    if (status === 'ACCEPT') status = 'ACCEPTED';

    try {
        const updatedOrder = await updateOrderStatusInternal(req.params.id, status, {
            io: req.io,
            deliveryBoyId: req.user.id
        });

        res.json({ msg: `Order marked as ${status}`, status: updatedOrder.orderStatus, order: updatedOrder });
    } catch (err) {
        console.error('Delivery status update error:', err);
        res.status(400).json({ msg: err.message || 'Server error' });
    }
});

// Update Location
router.put('/location', auth, async (req, res) => {
    if (!['delivery_partner', 'admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Access denied' });
    const { lat, lng } = req.body;
    try {
        // Find active order to attach location if needed, or just update user?
        // Current schema has riderLocation on Order. Let's update all active orders for this rider.
        await Order.updateMany(
            { deliveryBoyId: req.user.id, status: { $in: ['PICKED_UP', 'OUT_FOR_DELIVERY'] } },
            { $set: { riderLocation: { lat, lng } } }
        );
        res.json({ msg: 'Location updated' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
