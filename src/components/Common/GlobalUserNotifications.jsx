import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNotificationSounds } from '../../hooks/useNotificationSounds';
import socket from '../../utils/socket';
import useFCM from '../../hooks/useFCM';

import { initNativePush } from '../../utils/nativePush'; // 🔥 Native Capacitor Support

const GlobalUserNotifications = () => {
    const { user, isLoggedIn } = useAuth();
    const { requestPermission } = useFCM();

    useEffect(() => {
        if (isLoggedIn) {
            // 🌐 Browser PWA Push (only if not native)
            if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                const timer = setTimeout(() => {
                    requestPermission();
                }, 3000);
                return () => clearTimeout(timer);
            }
            
            // 🏍️ Native Android Push (Capacitor)
            initNativePush('user');
        }
    }, [isLoggedIn, requestPermission]);

    const { addToast } = useToast();
    const { playUserNotification } = useNotificationSounds();

    useEffect(() => {
        // Only run for logged-in regular users (not admin/delivery)
        if (!isLoggedIn || !user || (user.role && user.role !== 'user')) return;

        // Join User Room (server expects joinUser event)
        const userId = user.id || user._id;
        if (userId) {
            // Ensure socket is connected
            if (!socket.connected) socket.connect();
            socket.emit('joinUser', userId);
            console.log('🔔 Global Notifications: Joined room user-' + userId);
        }

        // Listen for Global Updates targeted at this user
        const handleUpdate = (order) => {
            console.log('🔔 Global Notification Received:', order._id, order.status);

            // Ignore initial statuses (user already knows they just placed it)
            if (['CREATED', 'PAYMENT_PENDING', 'PENDING_ACCEPTANCE'].includes(order.status)) return;

            // List of statuses that warrant a global toast notification
            const trackableStatuses = [
                'PAYMENT_CONFIRMED',
                'ACCEPTED',
                'ASSIGNED',
                'PICKED_UP',
                'OUT_FOR_DELIVERY',
                'ON_THE_WAY',
                'DELIVERED',
                'CANCELLED'
            ];

            if (!trackableStatuses.includes(order.status)) return;

            // Play Notification Sound
            playUserNotification();

            // Format User-Friendly Message
            const orderIdShort = order._id.slice(-6).toUpperCase();
            let msg = `Order #${orderIdShort} status: ${order.status}`;
            let type = 'info';

            switch (order.status) {
                case 'PAYMENT_CONFIRMED':
                case 'ACCEPTED':
                    msg = `Order #${orderIdShort} is being prepared! 🍳`;
                    type = 'success';
                    break;
                case 'ASSIGNED':
                    msg = `Rider assigned for #${orderIdShort}! 🛵`;
                    break;
                case 'PICKED_UP':
                    msg = `Order #${orderIdShort} picked up! 📦`;
                    break;
                case 'OUT_FOR_DELIVERY':
                case 'ON_THE_WAY':
                    msg = `Order #${orderIdShort} is on the way! 📍`;
                    type = 'warning'; // Orange color often used for transit
                    break;
                case 'DELIVERED':
                    msg = `Order #${orderIdShort} Delivered! Enjoy your meal! 🎉`;
                    type = 'success';
                    break;
                case 'CANCELLED':
                    msg = `Order #${orderIdShort} was cancelled. Check status for details. ❌`;
                    type = 'error';
                    break;
                default:
                    break;
            }

            // Show Toast (Global Alert)
            addToast(msg, type);
        };

        socket.on('userOrderUpdate', handleUpdate);
        socket.on('orderUpdated', handleUpdate);

        return () => {
            socket.off('userOrderUpdate', handleUpdate);
            socket.off('orderUpdated', handleUpdate);
        };
    }, [isLoggedIn, user]);

    return null; // This component handles side-effects only
};

export default GlobalUserNotifications;
