const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');
const auth = require('../middleware/auth');

// Middleware to protect super_admin routes
const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        next();
    } else {
        res.status(403).json({ msg: 'Access denied. Super Admin role required.' });
    }
};

router.use(auth, isSuperAdmin);

// Get Super Admin Dashboard Stats
router.get('/dashboard-stats', async (req, res) => {
    try {
        const settings = await SystemSettings.findOne();
        const platformFeePerOrder = settings?.platformFee?.amount || 0;

        const now = new Date();
        const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Revenue logic: platformFee * deliveredOrders
        // Condition: status === 'DELIVERED', paymentStatus === 'PAID' or paymentMode === 'COD'
        const baseQuery = {
            status: 'DELIVERED',
            $or: [
                { paymentStatus: { $in: ['PAID', 'ADMIN_CONFIRMED', 'USER_MARKED_PAID'] } },
                { paymentMode: 'COD' }
            ]
        };

        const todayOrders = await Order.countDocuments({ ...baseQuery, createdAt: { $gte: startOfToday } });
        const monthlyOrders = await Order.countDocuments({ ...baseQuery, createdAt: { $gte: startOfMonth } });
        const totalOrders = await Order.countDocuments(baseQuery);

        // Calculate Growth (simple comparison with yesterday)
        const yesterdayStart = new Date(startOfToday);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(startOfToday);
        yesterdayEnd.setMilliseconds(-1);

        const yesterdayOrders = await Order.countDocuments({ ...baseQuery, createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } });
        const growth = yesterdayOrders === 0 ? 100 : Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100);

        // Weekly Revenue Data
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const s = new Date(date.setHours(0, 0, 0, 0));
            const e = new Date(date.setHours(23, 59, 59, 999));

            const orders = await Order.countDocuments({ ...baseQuery, createdAt: { $gte: s, $lte: e } });
            weeklyData.push({
                day: s.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: orders * platformFeePerOrder,
                orders
            });
        }

        // Monthly Revenue Data (Last 12)
        const monthlyData = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const ms = new Date(date.getFullYear(), date.getMonth(), 1);
            const me = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

            const orders = await Order.countDocuments({ ...baseQuery, createdAt: { $gte: ms, $lte: me } });
            monthlyData.push({
                month: ms.toLocaleDateString('en-US', { month: 'short' }),
                revenue: orders * platformFeePerOrder,
                orders
            });
        }

        // Payment Mode Distribution
        const paymentStatsRaw = await Order.aggregate([
            { $match: baseQuery },
            { $group: { _id: "$paymentMethod", count: { $sum: 1 } } }
        ]);
        const paymentStats = paymentStatsRaw.map(p => ({
            name: p._id || 'UNSET',
            value: p.count
        }));

        res.json({
            summary: {
                todayOrders,
                todayRevenue: todayOrders * platformFeePerOrder,
                monthlyOrders,
                monthlyRevenue: monthlyOrders * platformFeePerOrder,
                totalOrders,
                totalRevenue: totalOrders * platformFeePerOrder,
                platformFee: platformFeePerOrder,
                growth
            },
            weeklyData,
            monthlyData,
            paymentStats
        });

    } catch (err) {
        console.error('Super Admin Stats Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// CSV Export Placeholder (Simplified)
router.get('/export-report', async (req, res) => {
    try {
        const settings = await SystemSettings.findOne();
        const fee = settings?.platformFee?.amount || 0;
        const orders = await Order.find({ status: 'DELIVERED' }).select('_id totalAmount createdAt paymentMode');

        let csv = 'Order ID,Date,Amount,Payment Mode,Platform Fee\n';
        orders.forEach(o => {
            csv += `${o._id},${o.createdAt.toISOString()},${o.totalAmount},${o.paymentMode},${fee}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=revenue_report.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).send('Export failed');
    }
});

// Super Admin Reset Orders & Revenue
router.post('/reset-orders', async (req, res) => {
    const { confirmationText, superAdminPassword } = req.body;
    const bcrypt = require('bcryptjs');

    try {
        // 1. Double Confirmation: Text check
        if (confirmationText !== 'RESET') {
            return res.status(400).json({ msg: 'Confirmation text must be exactly RESET' });
        }

        // 2. Double Confirmation: Password check
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'Super Admin user not found' });

        const isMatch = await bcrypt.compare(superAdminPassword, user.password || user.pin);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid Super Admin password' });
        }

        // 3. Delete Data
        const OrderDraft = require('../models/OrderDraft');
        const deletedOrders = await Order.deleteMany({});
        const deletedDrafts = await OrderDraft.deleteMany({});

        // 4. Update Admin Dashboard Reset Date (so admin stats also definitely show 0)
        await SystemSettings.findOneAndUpdate({}, { dashboardResetAt: new Date() }, { upsert: true });

        // 5. Audit Log
        console.log(`[AUDIT] SUPER RESET: Super Admin ${user.mobile} (${user._id}) performed a complete order/revenue reset at ${new Date().toISOString()}`);
        console.log(`[AUDIT] Deleted ${deletedOrders.deletedCount} orders and ${deletedDrafts.deletedCount} order drafts.`);

        res.json({
            success: true,
            msg: `Platform reset complete. ${deletedOrders.deletedCount} orders removed.`,
            stats: {
                deletedOrders: deletedOrders.deletedCount,
                deletedDrafts: deletedDrafts.deletedCount
            }
        });

    } catch (err) {
        console.error('Super Reset Error:', err);
        res.status(500).json({ msg: 'Platform reset failed' });
    }
});

module.exports = router;
