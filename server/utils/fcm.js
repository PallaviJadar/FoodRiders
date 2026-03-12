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

    const isOrderAlert = data.click_action && (
        data.click_action.includes('/admin/orders') ||
        data.click_action.includes('/delivery-dashboard') ||
        data.type === 'admin_order' ||
        data.type === 'new_order' ||
        data.type === 'assigned'
    );

    // For Android, we RELY STRICTLY on the android: { notification: { channel_id } } 
    // to ensure the OS uses our Siren and vibration settings.
    // Including a top-level notification object can sometimes bypass the channel.
    const message = {
        data: {
            ...stringData,
            title: title,
            message: body, // Native app expects 'message'
            body: body,    // Fallback
            type: isOrderAlert ? (data.type || 'new_order') : 'default',
            click_action: data.click_action || '/admin/orders',
            is_critical: isOrderAlert ? 'true' : 'false'
        },
        token: token,
        android: {
            priority: 'high',
            ttl: 0,
            notification: {
                channel_id: 'foodriders_urgent_v5', // 🔥 MATCH V5 HYPER
                sound: 'siren', 
                priority: 'max',
                visibility: 'public', // 🔥 BYPASS LOCK SCREEN
                ticker: '🚨 HYPER ALERT: NEW ORDER!',
                tag: 'emergency_order',
                color: '#ff0000',
                notification_priority: 'PRIORITY_MAX',
                category: 'alarm' // 🔥 TREAT AS ALARM
            }
        },
        apns: {
            payload: {
                aps: {
                    sound: isOrderAlert ? 'siren.wav' : 'default',
                    badge: 1,
                    category: isOrderAlert ? 'ORDER_ALERT' : 'DEFAULT'
                }
            }
        },
        webpush: {
            headers: { Urgency: 'high', TTL: '86400' },
            notification: {
                title, body,
                icon: '/Logo-Img.png',
                badge: '/Logo-Img.png',
                requireInteraction: true,
                vibrate: isOrderAlert ? [500, 200, 500, 100, 500] : [200]
            },
            fcmOptions: {
                link: data.click_action || '/admin/orders'
            }
        }
    };

    // ONLY ADD TOP-LEVEL NOTIFICATION FOR NON-ANDROID (PWA / IOS)
    // On Android Native, if this exists, it might override our Channel Sound.
    message.notification = {
        title,
        body,
        sound: isOrderAlert ? 'siren' : 'default'
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
            if (excludeUserId && admin._id.toString() === excludeUserId.toString()) {
                continue;
            }
            await notifyUser(admin._id, title, body, { ...data, click_action: '/admin/orders' });
        }
    } catch (err) {
        console.error('[FCM] notifyAdmins Error:', err);
    }
};

module.exports = { sendPushNotification, notifyUser, notifyAdmins };
