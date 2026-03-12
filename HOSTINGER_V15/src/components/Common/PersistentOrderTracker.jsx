import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import css from './PersistentOrderTracker.module.css';

const PersistentOrderTracker = () => {
    const { user, isLoggedIn } = useAuth();
    const { socket, isConnected } = useSocket();
    const [activeOrder, setActiveOrder] = useState(null);
    const [isExpanded, setIsExpanded] = useState(() => {
        try {
            return localStorage.getItem('trackerExpanded') === 'true';
        } catch (e) {
            return false;
        }
    });
    const [lastStatus, setLastStatus] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const flashIntervalRef = useRef(null);

    // Hide if on certain pages where tracker might be redundant or invasive
    const isExcludedPage = location.pathname.startsWith('/order-tracking') ||
        location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/delivery');

    const fetchActiveOrder = async () => {
        if (!isLoggedIn || (!user?.id && !user?._id)) return;
        try {
            const userId = user.id || user._id;
            const res = await fetch(`/api/orders/active/${userId}`);
            const data = await res.json();
            const active = Array.isArray(data) ? data[0] : null;

            if (active) {
                setActiveOrder(active);
                handleStatusChange(active);
            } else {
                setActiveOrder(null);
                stopFlashing();
            }
        } catch (err) {
            console.error('Tracker Polling Error:', err);
        }
    };

    const handleStatusChange = (order) => {
        if (!lastStatus || lastStatus !== order.status) {
            // Priority 1: Browser Notification
            const isNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;
            if (isNotificationSupported && Notification.permission === 'granted' && lastStatus) {
                new Notification("Order Update 🍕", {
                    body: `Your order #${order._id.slice(-6).toUpperCase()} is now: ${getStatusText(order.status)}`,
                    icon: '/favicon.ico'
                });
            }

            // Priority 2: Tab Flashing
            if (document.hidden && lastStatus) {
                startFlashing(order.status);
            }

            setLastStatus(order.status);
        }
    };

    const startFlashing = (status) => {
        stopFlashing();
        const msg = getStatusText(status);
        let showOriginal = false;
        flashIntervalRef.current = setInterval(() => {
            document.title = showOriginal ? "FoodRiders" : `🔴 ${msg}`;
            showOriginal = !showOriginal;
        }, 1500);
    };

    const stopFlashing = () => {
        if (flashIntervalRef.current) {
            clearInterval(flashIntervalRef.current);
            flashIntervalRef.current = null;
        }
        document.title = "FoodRiders";
    };

    useEffect(() => {
        if (!isLoggedIn) {
            setActiveOrder(null);
            stopFlashing();
            return;
        }

        // Initial fetch
        fetchActiveOrder();

        const handleUpdate = (updatedOrder) => {
            // Use functional update to avoid dependency on activeOrder state
            setActiveOrder(prev => {
                if (prev && updatedOrder._id === prev._id) {
                    if (['DELIVERED', 'CANCELLED', 'REJECTED'].includes(updatedOrder.status)) {
                        stopFlashing();
                        return null;
                    }
                    handleStatusChange(updatedOrder);
                    return updatedOrder;
                } else if (!prev) {
                    // If we didn't have an order, maybe a new one was just created
                    fetchActiveOrder();
                }
                return prev;
            });
        };

        if (socket) {
            socket.on('userOrderUpdate', handleUpdate);
        }

        // Poll every 15s as mandatory fallback (Staggered to avoid storm)
        const pollInterval = setInterval(fetchActiveOrder, 15000);

        const focusHandler = () => stopFlashing();
        window.addEventListener('focus', focusHandler);

        return () => {
            if (socket) {
                socket.off('userOrderUpdate', handleUpdate);
            }
            clearInterval(pollInterval);
            window.removeEventListener('focus', focusHandler);
            stopFlashing();
        };
    }, [isLoggedIn, user, socket]); // 🔥 removed activeOrder?._id to stop the storm

    const toggleExpand = (e) => {
        e.stopPropagation();
        const newState = !isExpanded;
        setIsExpanded(newState);
        try {
            localStorage.setItem('trackerExpanded', newState);
        } catch (e) { }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'CREATED': return 'Preparing Order';
            case 'PAYMENT_PENDING': return 'Awaiting Payment';
            case 'PAYMENT_CONFIRMED': return 'Order Confirmed';
            case 'ASSIGNED':
            case 'ACCEPTED': return 'Partner Assigned';
            case 'READY_FOR_PICKUP': return 'Ready for Pickup';
            case 'PICKED_UP': return 'Picked Up';
            case 'OUT_FOR_DELIVERY':
            case 'ON_THE_WAY': return 'Out for Delivery';
            case 'ARRIVING': return 'Arriving Soon';
            default: return 'Processing...';
        }
    };

    const getProgressIndex = (status) => {
        const steps = [
            ['CREATED', 'PAYMENT_PENDING'],
            ['PAYMENT_CONFIRMED'],
            ['ASSIGNED', 'ACCEPTED', 'READY_FOR_PICKUP'],
            ['PICKED_UP'],
            ['OUT_FOR_DELIVERY', 'ON_THE_WAY', 'ARRIVING']
        ];

        const index = steps.findIndex(group => group.includes(status));
        return index === -1 ? 0 : index;
    };

    if (!activeOrder || isExcludedPage) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={`${css.trackerWrapper} ${isExpanded ? css.isExpanded : ''}`}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                drag
                dragMomentum={false}
                dragConstraints={{ left: -window.innerWidth + 350, right: 0, top: -window.innerHeight + 100, bottom: 0 }}
                style={{ cursor: 'grab' }}
                whileDrag={{ cursor: 'grabbing', scale: 1.02, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
            >
                {/* Header / Collapsed View */}
                <div className={css.trackerHeader} onClick={toggleExpand}>
                    <div className={css.headerInfo}>
                        <div className={css.liveDot}></div>
                        <div className={css.textBlock}>
                            <span className={css.statusTitle}>{getStatusText(activeOrder.status)}</span>
                            <span className={css.restaurantName}>{activeOrder.restaurantName || 'Order Tracking'}</span>
                        </div>
                    </div>

                    <div className={css.headerRight}>
                        {!isConnected && <span className={css.reconnecting}>Reconnecting...</span>}
                        <div className={css.expandBtn}>
                            <span>⌄</span>
                        </div>
                    </div>
                </div>

                {/* Expanded Details */}
                <motion.div
                    className={css.expandedContent}
                    initial={false}
                    animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                    style={{ overflow: 'hidden' }}
                >
                    <div className={css.progressContainer}>
                        {[1, 2, 3, 4, 5].map((s, i) => (
                            <div key={s} className={`${css.step} ${i <= getProgressIndex(activeOrder.status) ? css.active : ''}`}>
                                <div className={css.stepDot}></div>
                                {i < 4 && <div className={css.line}></div>}
                            </div>
                        ))}
                    </div>

                    <div className={css.detailsRow}>
                        <div className={css.etaBox}>
                            <span className={css.etaLabel}>ETA</span>
                            <span className={css.etaValue}>{activeOrder.deliveryTime || '25-35'} min</span>
                        </div>
                        <div className={css.orderBrief}>
                            <span className={css.orderIdLabel}>Order ID</span>
                            <span className={css.orderIdValue}>#{activeOrder._id.slice(-6).toUpperCase()}</span>
                        </div>
                    </div>

                    <div className={css.actionButtons}>
                        <button className={css.btnSecondary} onClick={() => navigate(`/order-tracking/${activeOrder._id}`)}>
                            Live Map
                        </button>
                        <button className={css.btnChat} onClick={() => navigate(`/order-tracking/${activeOrder._id}?chat=true`)}>
                            Chat
                        </button>
                        {activeOrder.deliveryBoyId?.mobile && (
                            <a href={`tel:${activeOrder.deliveryBoyId.mobile}`} className={css.btnCall}>
                                Call Rider
                            </a>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PersistentOrderTracker;
