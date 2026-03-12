const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const User = require('../models/User');
const Order = require('../models/Order');
const UsageStats = require('../models/UsageStats');

// Helper to get start of period
const getStartDate = (daysAgo) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - daysAgo);
    return d;
};

// GET usage statistics
router.get('/usage-stats', async (req, res) => {
    try {
        const SystemSettings = require('../models/SystemSettings');
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = new SystemSettings();
            await settings.save();
        }

        const resetAt = settings.dashboardResetAt || new Date('2000-01-01');

        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
        const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);

        // Effective dates considering resetAt
        const getEffectiveDate = (targetDate) => targetDate > resetAt ? targetDate : resetAt;

        // Calculate User Stats (Community)
        // GENUINE STATS: Always show lifetime total for 'Total Registered'
        const [usersToday, last7Days, thisMonth, thisYear, totalRegistered] = await Promise.all([
            User.countDocuments({ role: 'user', createdAt: { $gte: startOfDay } }),
            User.countDocuments({ role: 'user', createdAt: { $gte: sevenDaysAgo } }),
            User.countDocuments({ role: 'user', createdAt: { $gte: thirtyDaysAgo } }),
            User.countDocuments({ role: 'user', createdAt: { $gte: startOfYear } }),
            User.countDocuments({ role: 'user' })
        ]);

        // --- INSIGHTS CALCULATION ---

        // 1. Peak Usage Time (Today) from Orders
        const todayOrders = await Order.find({
            createdAt: { $gte: getEffectiveDate(startOfDay) }
        }).select('createdAt');

        let peakTime = "7:30 PM – 9:00 PM";
        if (todayOrders.length > 3) {
            const hours = {};
            todayOrders.forEach(o => {
                const h = new Date(o.createdAt).getHours();
                hours[h] = (hours[h] || 0) + 1;
            });
            const peakHour = Object.keys(hours).reduce((a, b) => hours[a] > hours[b] ? a : b);
            const peakDate = new Date();
            peakDate.setHours(peakHour);
            const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            peakTime = `${formatTime(peakDate)} – ${formatTime(new Date(peakDate.getTime() + 60 * 60 * 1000))}`;
        }

        // 2. Sparkline (Last 7 Days Order Activity)
        const sparklineData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - i);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            if (nextDay < resetAt) {
                sparklineData.push(0);
            } else {
                const effectiveStart = date > resetAt ? date : resetAt;
                const count = await Order.countDocuments({ createdAt: { $gte: effectiveStart, $lt: nextDay } });
                sparklineData.push(count || 0);
            }
        }

        // 3. Active Town
        const topTownStats = await Order.aggregate([
            { $match: { createdAt: { $gte: getEffectiveDate(sevenDaysAgo) } } },
            { $group: { _id: "$deliveryAddress.city", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        let activeTown = { name: "Mahalingapura", count: "High activity" };
        if (topTownStats.length > 0 && topTownStats[0]._id) {
            activeTown = {
                name: topTownStats[0]._id,
                count: `${topTownStats[0].count} orders this week`
            };
        }

        res.json({
            usersToday,
            last7Days,
            thisMonth,
            thisYear,
            totalRegistered,
            insights: {
                peakTime,
                sparkline: sparklineData,
                activeTown
            }
        });
    } catch (err) {
        console.error('Stats fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch community stats' });
    }
});

// POST reset all visitor/usage stats (fresh deployment)
router.post('/reset-stats', async (req, res) => {
    try {
        const visitorResult = await Visitor.deleteMany({});
        const statsResult = await UsageStats.deleteMany({});
        res.json({
            success: true,
            message: 'All stats reset to zero',
            deletedVisitors: visitorResult.deletedCount,
            deletedStats: statsResult.deletedCount
        });
    } catch (err) {
        console.error('Reset stats error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 👑 DATABASE & ROLE RECOVERY ROUTE (SUPER ADMIN)
router.get('/role-fix', async (req, res) => {
    try {
        const { mobile, role, pass } = req.query;
        if (!mobile) return res.status(400).json({ msg: 'Mobile number required' });

        const user = await User.findOne({ mobile });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Update Role if provided
        if (role) {
            user.role = role;
        }

        // Force Reset Password/PIN if 'pass' is provided
        if (pass) {
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(pass, salt);
            user.password = hashed;
            user.pin = hashed;
            user.loginAttempts = 0;
            user.lockUntil = undefined;
        }

        await user.save();

        res.json({
            success: true,
            msg: `Security Update: Profile for ${user.fullName || mobile} updated.`,
            updatedRole: user.role,
            passwordReset: !!pass,
            instruction: 'Please logout and login with the new credentials.'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📊 DIRECT DB DIAGNOSTIC (Public for troubleshooting)
router.get('/db-check', async (req, res) => {
    try {
        const Restaurant = require('../models/Restaurant');
        const MenuItem = require('../models/MenuItem');
        const CarouselItem = require('../models/CarouselItem');
        const Popup = require('../models/Popup');
        const Announcement = require('../models/Announcement');

        const [restaurants, menuItems, carousels, popups, announcements] = await Promise.all([
            Restaurant.countDocuments(),
            MenuItem.countDocuments(),
            CarouselItem.countDocuments(),
            Popup.countDocuments(),
            Announcement.countDocuments()
        ]);

        res.json({
            status: 'Online',
            database: 'Connected',
            dbName: require('mongoose').connection.name,
            counts: {
                restaurants,
                menuItems,
                carousels,
                popups,
                announcements
            },
            time: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ status: 'Error', error: err.message });
    }
});

module.exports = router;
