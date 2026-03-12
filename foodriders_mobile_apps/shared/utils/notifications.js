import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { playSiren, stopSiren } from './siren';

// Configure how notifications are handled when the app is open
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('foodriders_orders', {
            name: 'Order Notifications',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#ed1c24',
            sound: 'siren.wav', // Siren sound for Android
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }
        token = (await Notifications.getDevicePushTokenAsync()).data;
        console.log('FCM Device Token:', token);

        // Send token to backend
        try {
            await api.post(ENDPOINTS.UPDATE_TOKEN, {
                token,
                deviceType: Platform.OS,
                browser: 'expo-app'
            });
            console.log('FCM Token successfully synced to backend');
        } catch (err) {
            console.error('Failed to sync FCM token to backend:', err);
        }

    } else {
        alert('Must use physical device for Push Notifications');
    }

    return token;
};

export const setupNotificationListeners = (navigation, userRole) => {
    // Listener for notifications when the app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        const { title, data } = notification.request.content;

        // Logic: Trigger siren only for Admin/Rider for New Orders
        if ((userRole === 'admin' || userRole === 'delivery') &&
            (title.includes('New Order') || title.includes('Delivery Task'))) {
            playSiren();
        }
    });

    // Listener for when a user clicks on a notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        const { data } = response.notification.request.content;

        // Stop siren when user acknowledges notification
        stopSiren();

        if (data && data.orderId) {
            if (userRole === 'admin') {
                navigation.navigate('AdminOrderDetail', { orderId: data.orderId });
            } else if (userRole === 'delivery') {
                navigation.navigate('RiderDeliveryDetail', { orderId: data.orderId });
            } else {
                navigation.navigate('TrackOrder', { orderId: data.orderId });
            }
        }
    });

    return { notificationListener, responseListener };
};
