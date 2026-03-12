const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
};

// Export Orders CSV
router.get('/orders', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Forbidden' });

    try {
        const { startDate, endDate, status, restaurantName } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }
        if (status) query.status = status;
        if (restaurantName) {
            // Backward compatibility search
            query.$or = [
                { restaurantName: restaurantName },
                { "items.0.restaurant": restaurantName }
            ];
        }

        const orders = await Order.find(query).sort({ createdAt: -1 });

        let csv = [
            'Order ID', 'Date', 'Time', 'User Name', 'User Mobile', 'Restaurant Name',
            'Subtotal', 'Delivery Charge', 'Platform Fee', 'Packaging Charge', 'Tip Amount',
            'Discount', 'Wallet Used', 'Final Total', 'Payment Method', 'Status', 'Distance (KM)'
        ].map(escapeCSV).join(',') + '\n';

        orders.forEach(order => {
            const dateObj = new Date(order.createdAt);
            const rName = order.restaurantName || (order.items && order.items.length > 0 ? order.items[0].restaurant : 'N/A');

            // Subtotal calculation from items
            const subtotal = (order.items || []).reduce((acc, item) => acc + (item.price * item.quantity), 0);

            const row = [
                order._id,
                dateObj.toLocaleDateString(),
                dateObj.toLocaleTimeString(),
                order.userDetails?.name || 'Guest',
                order.userDetails?.phone || 'N/A',
                rName,
                subtotal.toFixed(2),
                order.deliveryCharge || 0,
                order.platformFee || 0,
                order.packagingCharge || 0,
                order.tipAmount || 0,
                order.discountAmount || 0,
                order.walletAmountUsed || 0,
                order.totalAmount,
                order.paymentMode,
                order.status,
                order.deliveryDistance ? order.deliveryDistance.toFixed(2) : 0
            ];
            csv += row.map(escapeCSV).join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=foodriders-orders-${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csv);

    } catch (err) {
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// Export Users CSV
router.get('/users', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Forbidden' });

    try {
        const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });

        let csv = [
            'User ID', 'Name', 'Mobile', 'Signup Date', 'Total Orders', 'Wallet Balance', 'Referral Count', 'Status'
        ].map(escapeCSV).join(',') + '\n';

        users.forEach(user => {
            let status = 'Active';
            if (user.isBlocked) status = 'Blocked';
            else if (!user.isApproved) status = 'Pending';

            const row = [
                user._id,
                user.fullName,
                user.mobile,
                new Date(user.createdAt).toLocaleDateString(),
                user.totalOrders || 0,
                user.walletBalance || 0,
                user.referralCount || 0,
                status
            ];
            csv += row.map(escapeCSV).join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=foodriders-users-${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csv);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// Export Restaurants CSV
router.get('/restaurants', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Forbidden' });

    try {
        const restaurants = await Restaurant.find().sort({ name: 1 });

        // Aggregate order stats per restaurant
        const stats = await Order.aggregate([
            { $match: { status: 'DELIVERED' } },
            {
                $addFields: {
                    resolvedRestaurantName: {
                        $ifNull: ["$restaurantName", { $arrayElemAt: ["$items.restaurant", 0] }]
                    }
                }
            },
            {
                $group: {
                    _id: "$resolvedRestaurantName",
                    totalOrders: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" }
                }
            }
        ]);

        const statsMap = {};
        stats.forEach(s => {
            if (s._id) statsMap[s._id] = s;
        });

        let csv = [
            'Restaurant Name', 'Address', 'Categories', 'Delivery Radius (KM)', 'Rating', 'Total Delivered Orders', 'Revenue (₹)'
        ].map(escapeCSV).join(',') + '\n';

        restaurants.forEach(rest => {
            const rStats = statsMap[rest.name] || { totalOrders: 0, revenue: 0 };
            const categories = rest.categories.map(c => c.name).join(' | ');

            const row = [
                rest.name,
                rest.address,
                categories,
                rest.deliveryRadius || 5,
                rest.rating,
                rStats.totalOrders,
                rStats.revenue.toFixed(2)
            ];
            csv += row.map(escapeCSV).join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=foodriders-restaurants-${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csv);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

module.exports = router;
