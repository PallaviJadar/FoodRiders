import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAdminOrderNotifications } from '../../hooks/useNotificationSounds';
import socket from '../../utils/socket';
import { listenForForegroundMessages } from '../../utils/adminFCM';
import useFCM from '../../hooks/useFCM';
import css from './GlobalAdminNotifications.module.css';
import { useNavigate } from 'react-router-dom';

// 🛸 Persistent Locks (Global across re-mounts)
const globalFetchTimes = { orders: 0 };
let isFetchingOrders = false;

const GlobalAdminNotifications = () => {
    const { user, isLoggedIn } = useAuth();
    const isAdmin = isLoggedIn && user && (user.role === 'admin' || user.role === 'ADMIN' || user.role === 'super_admin');

    const { requestPermission } = useFCM();

    useEffect(() => {
        if (isAdmin && typeof Notification !== 'undefined' && Notification.permission === 'default') {
            const timer = setTimeout(() => {
                requestPermission();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isAdmin, requestPermission]);

    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [isMuted, setIsMuted] = useState(localStorage.getItem('isMuted') === 'true');
    const [notifications, setNotifications] = useState([]);

    // Filter orders to exclude those placed by the current admin themselves to prevent self-buzzing
    const sirenOrders = orders.filter(order => {
        const orderUserId = order.userId?._id || order.userId;
        const currentUserId = user?.id || user?._id;
        return orderUserId && currentUserId ? orderUserId.toString() !== currentUserId.toString() : true;
    });

    useAdminOrderNotifications(sirenOrders, isMuted);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const addLocalNotification = useCallback((order) => {
        // Prevent admin siren/notification if the current admin is the one who placed the order
        const orderUserId = order.userId?._id || order.userId;
        const currentUserId = user?.id || user?._id;

        if (orderUserId && currentUserId && orderUserId.toString() === currentUserId.toString()) {
            console.log('🔇 Admin Alert: Ignoring own order notification');
            return;
        }

        const id = Date.now() + Math.random();
        const newNotif = {
            id,
            order,
            title: '🚨 New Order Received!',
            message: `Order #${order._id.toString().slice(-6).toUpperCase()} by ${order.userDetails?.name || 'Customer'}`,
            amount: order.totalAmount,
            restaurant: order.restaurantName || order.items?.[0]?.restaurant || 'Restaurant'
        };

        setNotifications(prev => [newNotif, ...prev].slice(0, 3));
        setTimeout(() => removeNotification(id), 5000);
    }, [removeNotification, user]);

    useEffect(() => {
        if (!isAdmin) return;
        const handleMutedChange = () => {
            const muted = localStorage.getItem('isMuted') === 'true';
            setIsMuted(muted);
        };
        window.addEventListener('storage', handleMutedChange);
        window.addEventListener('mute-local-event', handleMutedChange);
        return () => {
            window.removeEventListener('storage', handleMutedChange);
            window.removeEventListener('mute-local-event', handleMutedChange);
        };
    }, [isAdmin]);

    // Use a ref for the fetch function so socket listeners always use the latest one
    // but the effect themselves don't trigger re-registers
    const fetchOrders = useCallback(async (force = false) => {
        if (!isAdmin) return;
        if (!force && document.hidden) return; // Silent while not looking

        // 🛡️ Global Throttle & Lock
        if (isFetchingOrders) return;
        const now = Date.now();
        if (!force && (now - globalFetchTimes.orders < 30000)) return;

        isFetchingOrders = true;
        globalFetchTimes.orders = now;

        try {
            const token = localStorage.getItem('adminToken');
            if (!token) return;
            const res = await fetch('/api/orders/admin?liveOnly=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const fetchedOrders = data.orders || [];
                setOrders(prev => {
                    fetchedOrders.forEach(order => {
                        const isNew = !prev.find(o => o._id === order._id);
                        const currentStatus = order.orderStatus || order.status;
                        const isPending = ['PENDING_ACCEPTANCE', 'CREATED', 'PAYMENT_PENDING', 'USER_MARKED_PAID'].includes(currentStatus);
                        if (isNew && isPending) addLocalNotification(order);
                    });
                    return fetchedOrders;
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            isFetchingOrders = false;
        }
    }, [isAdmin, addLocalNotification]);

    useEffect(() => {
        if (!isAdmin) return;
        let fcmUnsub = () => { };

        listenForForegroundMessages((msg) => {
            fetchOrders();
        }).then(unsub => { fcmUnsub = unsub; });

        fetchOrders(true); // Initial fetch ignore throttle

        const connectSocket = () => {
            if (!socket.connected) socket.connect();
            socket.emit('joinRole', 'admin');
            socket.emit('join-admin-room');
        };
        connectSocket();

        const handleNewOrder = (data) => {
            const order = data?.order || data;
            if (order && order._id) {
                const currentStatus = order.orderStatus || order.status;
                const isPending = ['PENDING_ACCEPTANCE', 'CREATED', 'PAYMENT_PENDING', 'USER_MARKED_PAID'].includes(currentStatus);
                if (isPending) {
                    setOrders(prev => {
                        if (prev.find(o => o._id === order._id)) return prev;
                        return [order, ...prev];
                    });
                    addLocalNotification(order);
                }
            }
            fetchOrders();
        };

        const handleUpdate = (data) => {
            const updatedOrder = data?.order || data;
            if (updatedOrder && updatedOrder._id) {
                setOrders(prev => {
                    const index = prev.findIndex(o => o._id === updatedOrder._id);
                    const currentStatus = updatedOrder.orderStatus || updatedOrder.status;
                    const isStillPending = ['PENDING_ACCEPTANCE', 'CREATED', 'PAYMENT_PENDING', 'USER_MARKED_PAID'].includes(currentStatus);
                    if (index !== -1) {
                        const next = [...prev];
                        if (isStillPending) next[index] = updatedOrder;
                        else next.splice(index, 1);
                        return next;
                    } else if (isStillPending) return [updatedOrder, ...prev];
                    return prev;
                });
            }
            fetchOrders();
        };

        const handleReminder = (data) => {
            if (data?.restartSiren) fetchOrders();
            if (data?.message) {
                const id = Date.now() + Math.random();
                setNotifications(prev => [{
                    id,
                    title: data.type === 'ACCEPT_REMINDER' ? '⏰ Order Pending' : '🏍️ Assign Rider',
                    message: data.message,
                    amount: '',
                    restaurant: ''
                }, ...prev].slice(0, 3));
                setTimeout(() => removeNotification(id), 5000);
            }
        };

        const handleStopSiren = (data) => {
            const orderId = data?.orderId;
            if (orderId) {
                setOrders(prev => prev.filter(o => o._id !== orderId));
            }
        };

        socket.on('newOrder', handleNewOrder);
        socket.on('new-order', handleNewOrder);
        socket.on('order:new', handleNewOrder);
        socket.on('adminOrderUpdate', handleUpdate);
        socket.on('orderUpdated', handleUpdate);
        socket.on('orderReminder', handleReminder);
        socket.on('stopSiren', handleStopSiren);

        const interval = setInterval(() => fetchOrders(), 30000);

        return () => {
            socket.off('newOrder', handleNewOrder);
            socket.off('new-order', handleNewOrder);
            socket.off('order:new', handleNewOrder);
            socket.off('adminOrderUpdate', handleUpdate);
            socket.off('orderUpdated', handleUpdate);
            socket.off('orderReminder', handleReminder);
            socket.off('stopSiren', handleStopSiren);
            clearInterval(interval);
            if (fcmUnsub) fcmUnsub();
        };
    }, [isAdmin, fetchOrders]);

    if (!isAdmin || notifications.length === 0) return null;

    return (
        <div className={css.notificationOverlay}>
            {notifications.map(notif => (
                <div
                    key={notif.id}
                    className={css.notificationCard}
                    onClick={() => {
                        navigate('/admin/orders');
                        removeNotification(notif.id);
                    }}
                >
                    <div className={css.iconContainer}>🛍️</div>
                    <div className={css.content}>
                        <h4 className={css.title}>{notif.title}</h4>
                        <p className={css.message}>{notif.message}</p>
                        {notif.amount && (
                            <div className={css.orderMeta}>
                                <span className={css.restaurant}>{notif.restaurant}</span>
                                <span className={css.amount}>₹{notif.amount}</span>
                            </div>
                        )}
                    </div>
                    <button
                        className={css.closeBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notif.id);
                        }}
                    >
                        ×
                    </button>
                    <div className={css.progressBar} />
                </div>
            ))}
        </div>
    );
};

export default GlobalAdminNotifications;
