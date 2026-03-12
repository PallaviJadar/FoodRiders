import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import audioManager from '../../utils/audioManager';
import css from './AdminSirenAlert.module.css';

const AdminSirenAlert = () => {
    const { socket, isConnected, joinRole, acknowledgeSiren } = useSocket();
    const [activeAlert, setActiveAlert] = useState(null);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (isConnected) {
            joinRole('admin');
        }
    }, [isConnected, joinRole]);

    useEffect(() => {
        if (!socket) return;

        const handleNewOrderAlert = async (data) => {
            const { eventId, order, requiresAction } = data;

            console.log('🚨 New order alert received:', eventId);

            // Don't play if already acknowledged or muted
            if (audioManager.acknowledgedEvents.has(eventId) || isMuted) {
                console.log('Skipping siren (acknowledged or muted)');
                return;
            }

            // Set active alert
            setActiveAlert({ eventId, order, requiresAction });

            // Play siren
            await audioManager.playAdminSiren(eventId);
        };

        socket.on('newOrderAlert', handleNewOrderAlert);

        return () => {
            socket.off('newOrderAlert', handleNewOrderAlert);
        };
    }, [socket, isMuted]);

    const handleAccept = useCallback(() => {
        if (activeAlert) {
            // Stop siren
            audioManager.stopAdminSiren(activeAlert.eventId);
            acknowledgeSiren(activeAlert.eventId);
            setActiveAlert(null);

            // Navigate to order or trigger accept action
            console.log('Order accepted:', activeAlert.order._id);
        }
    }, [activeAlert, acknowledgeSiren]);

    const handleReject = useCallback(() => {
        if (activeAlert) {
            // Stop siren
            audioManager.stopAdminSiren(activeAlert.eventId);
            acknowledgeSiren(activeAlert.eventId);
            setActiveAlert(null);

            console.log('Order rejected:', activeAlert.order._id);
        }
    }, [activeAlert, acknowledgeSiren]);

    const handleMute = useCallback(() => {
        setIsMuted(prev => !prev);
        if (activeAlert) {
            audioManager.stopAdminSiren(activeAlert.eventId);
            setActiveAlert(null);
        }

        // Store mute preference in session
        sessionStorage.setItem('adminSirenMuted', (!isMuted).toString());
    }, [isMuted, activeAlert]);

    const handleTestAlert = useCallback(async () => {
        const testEventId = `test-${Date.now()}`;
        await audioManager.playAdminSiren(testEventId);

        setTimeout(() => {
            audioManager.stopAdminSiren(testEventId);
        }, 3000); // Stop after 3 seconds
    }, []);

    // Load mute preference from session
    useEffect(() => {
        const savedMute = sessionStorage.getItem('adminSirenMuted');
        if (savedMute === 'true') {
            setIsMuted(true);
        }
    }, []);

    if (!activeAlert) {
        return (
            <div className={css.controls}>
                <button
                    className={css.muteBtn}
                    onClick={handleMute}
                    title={isMuted ? 'Unmute Alerts' : 'Mute Alerts'}
                >
                    {isMuted ? '🔇' : '🔔'} {isMuted ? 'Unmuted' : 'Muted'}
                </button>
                <button
                    className={css.testBtn}
                    onClick={handleTestAlert}
                    title="Test Alert Sound"
                >
                    🔔 Test Alert
                </button>
            </div>
        );
    }

    return (
        <div className={css.alertOverlay}>
            <div className={css.alertBox}>
                <div className={css.alertHeader}>
                    <div className={css.sirenIcon}>🚨</div>
                    <h2>NEW ORDER ALERT!</h2>
                </div>

                <div className={css.orderDetails}>
                    <p><strong>Order ID:</strong> {activeAlert.order._id.slice(-6)}</p>
                    <p><strong>Customer:</strong> {activeAlert.order.userDetails.name}</p>
                    <p><strong>Phone:</strong> {activeAlert.order.userDetails.phone}</p>
                    <p><strong>Amount:</strong> ₹{activeAlert.order.totalAmount}</p>
                    <p><strong>Payment:</strong> {activeAlert.order.paymentMode}</p>
                    <p><strong>Items:</strong> {activeAlert.order.items.length}</p>
                </div>

                <div className={css.actionButtons}>
                    <button
                        className={css.acceptBtn}
                        onClick={handleAccept}
                    >
                        ✅ Accept Order
                    </button>
                    <button
                        className={css.rejectBtn}
                        onClick={handleReject}
                    >
                        ❌ Reject Order
                    </button>
                </div>

                <button
                    className={css.muteSmall}
                    onClick={handleMute}
                >
                    🔇 Mute Alerts
                </button>
            </div>
        </div>
    );
};

export default AdminSirenAlert;
