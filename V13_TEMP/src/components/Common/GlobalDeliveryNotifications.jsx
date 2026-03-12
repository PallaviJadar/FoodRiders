import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotificationSounds } from '../../hooks/useNotificationSounds';
import { useToast } from '../../context/ToastContext';
import socket from '../../utils/socket';
import useFCM from '../../hooks/useFCM';

const GlobalDeliveryNotifications = () => {
    const { user, isLoggedIn } = useAuth();
    const { requestPermission } = useFCM();

    useEffect(() => {
        const isRider = isLoggedIn && user && (user.role === 'delivery' || user.role === 'delivery_partner');
        if (isRider && typeof Notification !== 'undefined' && Notification.permission === 'default') {
            const timer = setTimeout(() => {
                requestPermission();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isLoggedIn, user, requestPermission]);
    const { playDeliverySiren } = useNotificationSounds();
    const { addToast } = useToast();

    useEffect(() => {
        // Only for Delivery Partners
        const isRider = isLoggedIn && user && (user.role === 'delivery' || user.role === 'delivery_partner');
        if (!isRider) return;

        // Ensure connected
        if (!socket.connected) socket.connect();

        // Join personal delivery room
        const partnerId = user.id || user._id;
        socket.emit('joinDeliveryPartner', partnerId);
        console.log('🛵 Global Delivery: Joined room delivery_' + partnerId);

        // Handler for New Assignment
        const handleAssignment = (data) => {
            console.log('🔔 Delivery Assignment Received!', data);
            playDeliverySiren();
            addToast('🛵 New Order Assigned! Check Dashboard.', 'success');

            // Allow vibration if supported (mobile feature)
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try {
                    navigator.vibrate([200, 100, 200]);
                } catch (e) {
                    console.warn('Vibration failed:', e);
                }
            }
        };

        socket.on('deliveryAssigned', handleAssignment);
        socket.on('order:assigned', handleAssignment);
        socket.on('orderUpdate', (order) => {
            if (order.status === 'CANCELLED') {
                addToast('❌ Order #' + order._id.toString().slice(-6).toUpperCase() + ' was cancelled.', 'error');
            }
        });

        return () => {
            socket.off('deliveryAssigned', handleAssignment);
            socket.off('order:assigned', handleAssignment);
            socket.off('orderUpdate');
        };
    }, [isLoggedIn, user, addToast, playDeliverySiren]);

    return null;
};

export default GlobalDeliveryNotifications;
