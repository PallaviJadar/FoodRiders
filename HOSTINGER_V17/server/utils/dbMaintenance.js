/**
 * Database Indexes and Optimization
 * Run this script to add performance indexes
 */

const mongoose = require('mongoose');

async function createIndexes() {
    try {
        console.log('Creating database indexes...');

        // Order indexes
        const Order = require('../models/Order');
        await Order.collection.createIndex({ userId: 1 });
        await Order.collection.createIndex({ status: 1 });
        await Order.collection.createIndex({ createdAt: -1 });
        await Order.collection.createIndex({ deliveryBoyId: 1 });
        await Order.collection.createIndex({ isHiddenFromLive: 1, status: 1 });
        await Order.collection.createIndex({ 'userDetails.phone': 1 });
        console.log('✅ Order indexes created');

        // User indexes
        const User = require('../models/User');
        await User.collection.createIndex({ mobile: 1 }, { unique: true });
        await User.collection.createIndex({ email: 1 }, { sparse: true });
        await User.collection.createIndex({ role: 1 });
        await User.collection.createIndex({ isActive: 1 });
        console.log('✅ User indexes created');

        // Restaurant indexes
        const Restaurant = require('../models/Restaurant');
        await Restaurant.collection.createIndex({ displayOrder: 1 });
        await Restaurant.collection.createIndex({ isActive: 1 });
        await Restaurant.collection.createIndex({ name: 'text', description: 'text' });
        console.log('✅ Restaurant indexes created');

        // CategoryGroup indexes (if exists)
        try {
            const CategoryGroup = require('../models/CategoryGroup');
            await CategoryGroup.collection.createIndex({ displayOrder: 1 });
            await CategoryGroup.collection.createIndex({ isActive: 1 });
            console.log('✅ CategoryGroup indexes created');
        } catch (err) {
            console.log('CategoryGroup model not found, skipping...');
        }

        console.log('✅ All indexes created successfully');
    } catch (err) {
        console.error('Error creating indexes:', err);
    }
}

/**
 * Database maintenance utilities
 */
class DatabaseMaintenance {
    /**
     * Archive old completed orders (older than 90 days)
     */
    static async archiveOldOrders() {
        try {
            const Order = require('../models/Order');
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 90);

            const result = await Order.updateMany(
                {
                    status: { $in: ['DELIVERED', 'CANCELLED'] },
                    createdAt: { $lt: cutoffDate },
                    isArchived: { $ne: true }
                },
                {
                    $set: { isArchived: true }
                }
            );

            console.log(`Archived ${result.modifiedCount} old orders`);
            return result.modifiedCount;
        } catch (err) {
            console.error('Archive orders error:', err);
            return 0;
        }
    }

    /**
     * Clean up expired wallet credits
     */
    static async cleanExpiredWalletCredits() {
        try {
            const User = require('../models/User');
            const now = new Date();

            const result = await User.updateMany(
                {
                    'walletTransactions.expiresAt': { $lt: now },
                    'walletTransactions.isExpired': { $ne: true }
                },
                {
                    $set: { 'walletTransactions.$[elem].isExpired': true }
                },
                {
                    arrayFilters: [{ 'elem.expiresAt': { $lt: now } }]
                }
            );

            console.log(`Cleaned ${result.modifiedCount} expired wallet credits`);
            return result.modifiedCount;
        } catch (err) {
            console.error('Clean wallet credits error:', err);
            return 0;
        }
    }

    /**
     * Remove old notification logs (older than 30 days)
     */
    static async cleanOldNotifications() {
        try {
            // Implement if you have a notifications collection
            console.log('Notification cleanup not implemented');
            return 0;
        } catch (err) {
            console.error('Clean notifications error:', err);
            return 0;
        }
    }

    /**
     * Optimize database collections
     */
    static async optimizeCollections() {
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();

            for (const collection of collections) {
                await mongoose.connection.db.command({
                    compact: collection.name
                }).catch(() => {
                    // Compact may not be supported on all MongoDB versions
                });
            }

            console.log('Collections optimized');
        } catch (err) {
            console.error('Optimize collections error:', err);
        }
    }

    /**
     * Get database statistics
     */
    static async getStats() {
        try {
            const Order = require('../models/Order');
            const User = require('../models/User');
            const Restaurant = require('../models/Restaurant');

            const stats = {
                orders: {
                    total: await Order.countDocuments(),
                    active: await Order.countDocuments({
                        status: { $nin: ['DELIVERED', 'CANCELLED'] }
                    }),
                    today: await Order.countDocuments({
                        createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
                    })
                },
                users: {
                    total: await User.countDocuments(),
                    active: await User.countDocuments({ isActive: true })
                },
                restaurants: {
                    total: await Restaurant.countDocuments(),
                    active: await Restaurant.countDocuments({ isActive: true })
                }
            };

            return stats;
        } catch (err) {
            console.error('Get stats error:', err);
            return null;
        }
    }
}

/**
 * Run maintenance tasks
 */
async function runMaintenance() {
    console.log('Running database maintenance...');

    await DatabaseMaintenance.archiveOldOrders();
    await DatabaseMaintenance.cleanExpiredWalletCredits();
    await DatabaseMaintenance.cleanOldNotifications();

    console.log('Maintenance complete');
}

/**
 * Schedule maintenance tasks
 * Run daily at 3 AM
 */
function scheduleMaintenance() {
    const schedule = require('node-schedule');

    // Run daily at 3 AM
    schedule.scheduleJob('0 3 * * *', async () => {
        console.log('Starting scheduled maintenance...');
        await runMaintenance();
    });

    console.log('Maintenance tasks scheduled (daily at 3 AM)');
}

module.exports = {
    createIndexes,
    DatabaseMaintenance,
    runMaintenance,
    scheduleMaintenance
};
