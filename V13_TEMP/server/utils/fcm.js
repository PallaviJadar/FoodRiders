const { initFirebase } = require('./firebase');
const admin = initFirebase();
const messaging = admin ? admin.messaging() : null;

/**
 * Send push notification to a specific device token
 */
const sendPushNotification = async (token, title, body, data = {}) => {
    if (!messaging || !token) return;

    // Ensure all data values are strings (FCM requirement)
    const stringData = {};
    for (const [key, val] of Object.entries(data)) {
        stringData[key] = String(val);
    }

    const message = {
        notification: { title, body },
        data: {
            ...stringData,
            click_action: data.click_action || '/admin/orders'
        },
        token: token,
        android: {
            priority: 'high',
            notification: {
                channelId: 'foodriders_orders',
                priority: 'max',
                defaultSound: true,
                defaultVibrateTimings: true,
                notificationCount: 1,
            }
        },
        webpush: {
            headers: { Urgency: 'high', TTL: '86400' },
            notification: {
                title, body,
                icon: '/Logo-Img.png',
                badge: '/Logo-Img.png',
                requireInteraction: true,
                vibrate: [300, 100, 300, 100, 300]
            },
            fcmOptions: {
                link: data.click_action || '/admin/orders'
            }
        }
    };

    try {
        await messaging.send(message);
        return { success: true };
    } catch (error) {
        if (error.code === 'messaging/registration-token-not-registered' ||
            error.code === 'messaging/invalid-registration-token') {
            return { error: 'invalid-token' };
        }
        return { error: error.message };
    }
};

/**
 * Helper to send to all tokens of a user
 */
const notifyUser = async (userId, title, body, data = {}) => {
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) return;

    let tokens = [];
    if (user.fcmTokens && user.fcmTokens.length > 0) {
        tokens = user.fcmTokens.map(t => t.token);
    } else if (user.deviceToken) {
        tokens = [user.deviceToken];
    }

    if (tokens.length === 0) return;

    const results = await Promise.all(tokens.map(token =>
        sendPushNotification(token, title, body, data)
    ));

    // Cleanup invalid tokens
    let changed = false;
    results.forEach((res, index) => {
        if (res?.error === 'invalid-token') {
            const invalidToken = tokens[index];
            if (user.deviceToken === invalidToken) {
                user.deviceToken = null;
                changed = true;
            }
            if (user.fcmTokens) {
                const initialLen = user.fcmTokens.length;
                user.fcmTokens = user.fcmTokens.filter(t => t.token !== invalidToken);
                if (user.fcmTokens.length !== initialLen) changed = true;
            }
        }
    });

    if (changed) await user.save();
};

/**
 * Send notification to ALL admins
 */
const notifyAdmins = async (title, body, data = {}, excludeUserId = null) => {
    const User = require('../models/User');
    try {
        const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
        for (const admin of admins) {
            // Check if we should skip this admin (e.g., they are the one who placed the order)
            if (excludeUserId && admin._id.toString() === excludeUserId.toString()) {
                console.log(`[FCM] Skipping notification for admin ${admin._id} (Order Creator)`);
                continue;
            }
            await notifyUser(admin._id, title, body, { ...data, click_action: '/admin/orders' });
        }
    } catch (err) {
        console.error('[FCM] notifyAdmins Error:', err);
    }
};

module.exports = { sendPushNotification, notifyUser, notifyAdmins };
