import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';

/**
 * Native Capacitor Push Notification Manager
 * 🚀 Handles background alerts, vibration, and siren for the Android App.
 */
export const initNativePush = async (role = 'admin') => {
    // 1. Only run in Native context (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
        console.log('[NativePush] Skipping: Not a native platform');
        return;
    }

    try {
        console.log('[NativePush] Initializing Capacitor Push Notifications...');

        // 2. Request Permission
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
            console.error('[NativePush] Permission Denied');
            return;
        }

        // 3. Register with FCM/APNS through Capacitor
        await PushNotifications.register();

        // 4. Listeners
        PushNotifications.addListener('registration', async (token) => {
            console.log('[NativePush] Token secured:', token.value.substring(0, 20) + '...');
            
            // Send token to backend
            const authToken = localStorage.getItem('adminToken') || localStorage.getItem('token') || localStorage.getItem('delivery_token');
            if (authToken) {
                try {
                    const endpoint = role === 'admin' ? '/api/admin/save-fcm-token' : '/api/user/update-token';
                    await axios.post(endpoint, 
                        { fcmToken: token.value, deviceType: 'android_native' },
                        { headers: { Authorization: `Bearer ${authToken}` } }
                    );
                    console.log('[NativePush] Token synced to backend');
                } catch (err) {
                    console.error('[NativePush] Token sync failed:', err);
                }
            }
        });

        PushNotifications.addListener('registrationError', (error) => {
            console.error('[NativePush] Registration Error:', error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('[NativePush] Received in Foreground:', notification);
            // OS handles the banner since we set channel high priority
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('[NativePush] Action performed:', notification);
            const data = notification.notification.data;
            if (data?.orderId) {
                window.location.href = `/admin/orders/${data.orderId}`;
            }
        });

    } catch (err) {
        console.error('[NativePush] Initialization fail:', err);
    }
};
