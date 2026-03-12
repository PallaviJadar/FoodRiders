const express = require('express');
const router = express.Router();
const webpush = require('web-push');

// Store subscriptions in memory (use database in production)
const subscriptions = new Map();

// VAPID keys (generate your own with: npx web-push generate-vapid-keys)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls';

// Configure web-push
webpush.setVapidDetails(
    'mailto:support@foodriders.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
    try {
        const { subscription, role, userId, deviceInfo } = req.body;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription' });
        }

        // Store subscription with metadata
        const subscriptionData = {
            subscription,
            role: role || 'user',
            userId: userId || 'guest',
            deviceInfo,
            subscribedAt: new Date(),
            lastUsed: new Date()
        };

        // Use endpoint as unique key
        subscriptions.set(subscription.endpoint, subscriptionData);

        console.log(`✅ New push subscription: ${role} (${userId})`);
        console.log(`Total subscriptions: ${subscriptions.size}`);

        res.status(201).json({
            success: true,
            message: 'Subscribed to push notifications'
        });
    } catch (err) {
        console.error('Subscribe error:', err);
        res.status(500).json({ error: 'Subscription failed' });
    }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
    try {
        const { subscription } = req.body;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription' });
        }

        subscriptions.delete(subscription.endpoint);

        console.log(`❌ Unsubscribed: ${subscription.endpoint}`);
        console.log(`Total subscriptions: ${subscriptions.size}`);

        res.json({ success: true, message: 'Unsubscribed successfully' });
    } catch (err) {
        console.error('Unsubscribe error:', err);
        res.status(500).json({ error: 'Unsubscribe failed' });
    }
});

// Send push notification to specific role
router.post('/send', async (req, res) => {
    try {
        const { role, title, body, data, vibrate, requireInteraction } = req.body;

        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }

        const payload = JSON.stringify({
            title: title || 'FoodRiders',
            body: body || 'You have a new notification',
            icon: '/Logo-Img.png',
            badge: '/Logo-Img.png',
            vibrate: vibrate || [200],
            tag: `${role}-${Date.now()}`,
            requireInteraction: requireInteraction || false,
            data: data || {}
        });

        // Get all subscriptions for this role
        const roleSubscriptions = Array.from(subscriptions.values())
            .filter(sub => sub.role === role);

        if (roleSubscriptions.length === 0) {
            return res.json({
                success: true,
                message: 'No subscriptions found for this role',
                sent: 0
            });
        }

        // Send to all subscriptions
        const results = await Promise.allSettled(
            roleSubscriptions.map(async (subData) => {
                try {
                    await webpush.sendNotification(subData.subscription, payload);
                    subData.lastUsed = new Date();
                    return { success: true, endpoint: subData.subscription.endpoint };
                } catch (err) {
                    // If subscription is invalid, remove it
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        subscriptions.delete(subData.subscription.endpoint);
                        console.log(`Removed invalid subscription: ${subData.subscription.endpoint}`);
                    }
                    return { success: false, endpoint: subData.subscription.endpoint, error: err.message };
                }
            })
        );

        const successful = results.filter(r => r.value?.success).length;
        const failed = results.filter(r => !r.value?.success).length;

        console.log(`📤 Push sent to ${role}: ${successful} successful, ${failed} failed`);

        res.json({
            success: true,
            sent: successful,
            failed: failed,
            total: roleSubscriptions.length
        });
    } catch (err) {
        console.error('Send push error:', err);
        res.status(500).json({ error: 'Failed to send push notification' });
    }
});

// Send push to specific user
router.post('/send-to-user', async (req, res) => {
    try {
        const { userId, title, body, data, vibrate } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const payload = JSON.stringify({
            title: title || 'FoodRiders',
            body: body || 'You have a new notification',
            icon: '/Logo-Img.png',
            badge: '/Logo-Img.png',
            vibrate: vibrate || [200],
            tag: `user-${userId}-${Date.now()}`,
            data: data || {}
        });

        // Get user's subscriptions
        const userSubscriptions = Array.from(subscriptions.values())
            .filter(sub => sub.userId === userId);

        if (userSubscriptions.length === 0) {
            return res.json({
                success: true,
                message: 'No subscriptions found for this user',
                sent: 0
            });
        }

        // Send to all user's devices
        const results = await Promise.allSettled(
            userSubscriptions.map(async (subData) => {
                try {
                    await webpush.sendNotification(subData.subscription, payload);
                    return { success: true };
                } catch (err) {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        subscriptions.delete(subData.subscription.endpoint);
                    }
                    return { success: false };
                }
            })
        );

        const successful = results.filter(r => r.value?.success).length;

        res.json({ success: true, sent: successful });
    } catch (err) {
        console.error('Send to user error:', err);
        res.status(500).json({ error: 'Failed to send push notification' });
    }
});

// Get subscription stats
router.get('/stats', (req, res) => {
    const stats = {
        total: subscriptions.size,
        byRole: {
            admin: 0,
            delivery: 0,
            user: 0
        }
    };

    subscriptions.forEach(sub => {
        if (stats.byRole[sub.role] !== undefined) {
            stats.byRole[sub.role]++;
        }
    });

    res.json(stats);
});

module.exports = router;
