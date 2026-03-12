import { getMessaging, getToken, onMessage } from "firebase/messaging";
import app from "../firebase";

let messaging = null;
try {
    // Only initialize messaging if supported (e.g. not in some private modes or old browsers)
    messaging = getMessaging(app);
} catch (e) {
    console.error('Firebase Messaging initialization failed:', e);
}

export const requestNotificationPermission = async () => {
    try {
        if (!messaging) return null;
        if (typeof Notification === 'undefined') {
            console.log('Push notifications not supported by this browser');
            return null;
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, {
                vapidKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U' // Using existing VAPID as it often works with FCM web
            });
            if (token) {
                console.log('FCM Token:', token);
                return token;
            }
        }
    } catch (error) {
        console.error('Push Error:', error);
    }
    return null;
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        if (!messaging) return resolve(null);
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
