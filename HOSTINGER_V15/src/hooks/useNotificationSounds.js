import { useEffect, useCallback, useState } from 'react';
import audioManager from '../utils/audioManager';

/**
 * Custom hook for notification sounds
 * Handles audio initialization and browser unlock
 */
export const useNotificationSounds = () => {
    useEffect(() => {
        // Initialize audio manager
        audioManager.initialize();

        // Unlock audio on first user interaction
        const unlockAudio = () => {
            audioManager.unlockAudio();
            // Remove listeners after first unlock
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };

        // Add listeners for various user interactions
        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    const playAdminSiren = useCallback(() => {
        audioManager.initialize();
        audioManager.playAdminSiren();
    }, []);

    const stopAdminSiren = useCallback(() => {
        audioManager.stopAdminSiren();
    }, []);

    const playDeliverySiren = useCallback(() => {
        audioManager.initialize();
        audioManager.playDeliverySiren();
    }, []);

    const stopDeliverySiren = useCallback(() => {
        audioManager.stopDeliverySiren();
    }, []);

    const playUserNotification = useCallback(() => {
        audioManager.initialize();
        audioManager.playUserNotification();
    }, []);

    const stopAll = useCallback(() => {
        audioManager.stopAll();
    }, []);

    const isAdminSirenPlaying = useCallback(() => {
        return audioManager.isAdminSirenPlaying();
    }, []);

    const isDeliverySirenPlaying = useCallback(() => {
        return audioManager.isDeliverySirenPlaying();
    }, []);

    return {
        playAdminSiren,
        stopAdminSiren,
        playDeliverySiren,
        stopDeliverySiren,
        playUserNotification,
        stopAll,
        isAdminSirenPlaying,
        isDeliverySirenPlaying
    };
};

/**
 * Hook for admin order notifications
 * Automatically plays siren for pending orders
 */
export const useAdminOrderNotifications = (orders, isMuted) => {
    const { playAdminSiren, stopAdminSiren, isAdminSirenPlaying } = useNotificationSounds();

    useEffect(() => {
        const checkLogic = () => {
            if (!orders || orders.length === 0 || isMuted) {
                if (isAdminSirenPlaying()) stopAdminSiren();
                return;
            }

            const hasPendingOrders = orders.some(order => {
                const currentStatus = order.orderStatus || order.status;
                const isStatusPending = ['PENDING_ACCEPTANCE', 'PAYMENT_PENDING', 'CREATED', 'USER_MARKED_PAID'].includes(currentStatus);
                return isStatusPending || order.paymentStatus === 'USER_MARKED_PAID';
            });

            if (hasPendingOrders) {
                if (!isAdminSirenPlaying()) {
                    console.log('🚨 SIREN TRIGGER: Pending orders found');
                    playAdminSiren();
                }
            } else if (isAdminSirenPlaying()) {
                console.log('🔇 SIREN STOP: No pending orders');
                stopAdminSiren();
            }
        };

        // Run immediately on status change
        checkLogic();

        // Also run a frequent interval for browser-blocked audio recovery
        const interval = setInterval(checkLogic, 1000);

        return () => clearInterval(interval);
    }, [orders, isMuted, playAdminSiren, stopAdminSiren, isAdminSirenPlaying]);

    return {
        stopAdminSiren,
        playAdminSiren
    };
};

/**
 * Hook for delivery boy notifications
 * Plays siren for orders ready for pickup
 */
export const useDeliveryNotifications = (orders, deliveryBoyId, isMuted) => {
    const { playDeliverySiren, stopDeliverySiren, isDeliverySirenPlaying } = useNotificationSounds();
    const [triggeredByHook, setTriggeredByHook] = useState(false);

    useEffect(() => {
        if (!orders || orders.length === 0 || !deliveryBoyId || isMuted) {
            if (triggeredByHook || isDeliverySirenPlaying()) {
                stopDeliverySiren();
                setTriggeredByHook(false);
            }
            return;
        }

        const hasReadyOrders = orders.some(order => {
            const isReady = ['ASSIGNED'].includes(order.orderStatus);
            const isAssigned = (typeof order.deliveryBoyId === 'object' ? order.deliveryBoyId?._id : order.deliveryBoyId) === deliveryBoyId;
            return isReady && isAssigned;
        });

        if (hasReadyOrders) {
            if (!isDeliverySirenPlaying()) {
                playDeliverySiren();
                setTriggeredByHook(true);
            }
        } else {
            if (triggeredByHook) {
                stopDeliverySiren();
                setTriggeredByHook(false);
            }
        }
    }, [orders, deliveryBoyId, isMuted, playDeliverySiren, stopDeliverySiren, isDeliverySirenPlaying, triggeredByHook]);

    return {
        stopDeliverySiren,
        playDeliverySiren
    };
};

/**
 * Hook for user order status notifications
 * Plays notification sound when order status changes
 */
export const useUserOrderNotifications = (orderStatus, previousStatus) => {
    const { playUserNotification } = useNotificationSounds();

    useEffect(() => {
        if (!orderStatus || !previousStatus || orderStatus === previousStatus) {
            return;
        }

        const notifyStatuses = [
            'PAYMENT_CONFIRMED',
            'ON_THE_WAY',
            'OUT_FOR_DELIVERY',
            'PICKED_UP',
            'ASSIGNED',
            'DELIVERED'
        ];

        if (notifyStatuses.includes(orderStatus)) {
            playUserNotification();
        }
    }, [orderStatus, previousStatus, playUserNotification]);

    return { playUserNotification };
};

export default useNotificationSounds;
