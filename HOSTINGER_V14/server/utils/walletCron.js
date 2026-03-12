
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * Syncs the walletBalance field in User model with the sum of ACTIVE ledger transactions
 * This ensures the cached balance in User model is accurate after expiry or manual edits.
 */
const syncAllUserBalances = async () => {
    try {
        const users = await User.find({ walletBalance: { $gt: 0 } });
        console.log(`[SYNC] Starting balance sync for ${users.length} users...`);

        for (const user of users) {
            // First expire any old transactions for this user
            await WalletTransaction.expireOldTransactions(user._id);

            // Calculate actual active balance from ledger
            const actualBalance = await WalletTransaction.getActiveBalance(user._id);

            if (user.walletBalance !== actualBalance) {
                console.log(`[SYNC] Updating balance for ${user.mobile}: ${user.walletBalance} -> ${actualBalance}`);
                user.walletBalance = actualBalance;
                await user.save();
            }
        }
        console.log('[SYNC] Balance sync completed.');
    } catch (error) {
        console.error('[SYNC] Error during balance sync:', error);
    }
};

/**
 * Global cleanup task for expired transactions
 */
const performDailyWalletCleanup = async () => {
    try {
        const now = new Date();
        console.log(`[CLEANUP] Starting daily wallet cleanup at ${now.toISOString()}...`);

        // 1. Mark expired transactions as EXPIRED globally
        const result = await WalletTransaction.updateMany(
            {
                status: { $in: ['ACTIVE', 'PARTIALLY_USED'] },
                expiryDate: { $lte: now }
            },
            {
                $set: { status: 'EXPIRED', remainingAmount: 0 }
            }
        );

        console.log(`[CLEANUP] Expired ${result.modifiedCount} ledger transactions.`);

        // 2. Sync balances for all users who might be affected
        await syncAllUserBalances();

    } catch (error) {
        console.error('[CLEANUP] Error during wallet cleanup:', error);
    }
};

// Simple cron emulator - runs every 24 hours
const startWalletCleanupCron = () => {
    // Run immediately on start
    performDailyWalletCleanup();

    // Then run every 24 hours
    setInterval(performDailyWalletCleanup, 24 * 60 * 60 * 1000);
};

module.exports = {
    performDailyWalletCleanup,
    syncAllUserBalances,
    startWalletCleanupCron
};
