import { useEffect, useState, useCallback } from 'react';
import { getFirebaseMessaging, requestFCMToken } from '../firebase';
import { onMessage } from 'firebase/messaging';
import toast from 'react-hot-toast';

let isSetupInitiated = false;
let isSyncing = false; // Global inflight guard

const useFCM = () => {
    const [token, setToken] = useState(null);

    const setupMessaging = useCallback(async () => {
        if (isSetupInitiated) return; // Locked: Only one registration attempt per session
        isSetupInitiated = true;
        try {
            const fcmToken = await requestFCMToken();
            if (fcmToken) {
                setToken(fcmToken);
                await saveTokenToBackend(fcmToken);
            }
        } catch (err) {
            console.error('[FCM] Setup error:', err);
        }
    }, []);

    const saveTokenToBackend = async (token) => {
        if (isSyncing) return;
        isSyncing = true;
        try {
            const adminToken = localStorage.getItem('adminToken');
            const userToken = localStorage.getItem('token');
            const deliveryToken = localStorage.getItem('delivery_token') || localStorage.getItem('deliveryToken');

            const finalAuth = adminToken || userToken || deliveryToken;
            if (!finalAuth) return;

            const browser = navigator.userAgent;
            const deviceType = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

            // User/Admin endpoint
            await fetch('/api/user/update-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${finalAuth}`
                },
                body: JSON.stringify({ token, deviceType, browser })
            });

            // Also try delivery endpoint if it's a delivery partner
            if (deliveryToken) {
                await fetch('/api/delivery/save-fcm-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${deliveryToken}`
                    },
                    body: JSON.stringify({ fcmToken: token })
                });
            }
        } catch (err) {
            console.warn('[FCM] Token sync failed', err);
        } finally {
            isSyncing = false;
        }
    };

    useEffect(() => {
        // Delay slightly to bypass automatic prompt blocking by browsers
        const timer = setTimeout(() => {
            if (typeof Notification !== 'undefined' &&
                (Notification.permission === 'granted' || Notification.permission === 'default')) {
                setupMessaging();
            }
        }, 2000);

        let unsubscribe;
        const initListener = async () => {
            const messaging = await getFirebaseMessaging();
            if (messaging) {
                unsubscribe = onMessage(messaging, (payload) => {
                    console.log('[FCM] Foreground message:', payload);
                    toast.success(payload.notification.body, {
                        icon: '🔔',
                        duration: 6000
                    });
                });
            }
        };

        initListener();
        return () => {
            clearTimeout(timer);
            if (unsubscribe) unsubscribe();
        };
    }, [setupMessaging]);

    return { token, requestPermission: setupMessaging };
};

export default useFCM;
