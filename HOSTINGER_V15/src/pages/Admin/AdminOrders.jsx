import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import css from './AdminOrders.module.css';

import socket from '../../utils/socket';
import Chat from '../../components/Chat.jsx';
import MuteButton from '../../components/Common/MuteButton';
import { motion, AnimatePresence } from 'framer-motion';

const AdminOrders = () => {
    const { orderId: highlightOrderId } = useParams();
    const highlightRef = useRef(null);
    const [orders, setOrders] = useState([]);
    // const [hiddenIds, setHiddenIds] = useState([]); // Removed in favor of backend cleaning
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [partners, setPartners] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [isMuted, setIsMuted] = useState(localStorage.getItem('isMuted') === 'true');
    const [actionLoading, setActionLoading] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellingOrder, setCancellingOrder] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [waSettings, setWaSettings] = useState(null);
    const backendUrl = '';

    // Fetch WA Settings on mount
    useEffect(() => {
        fetch('/api/payment-settings').then(res => res.json()).then(data => {
            setWaSettings(data.whatsappAlerts || null);
        }).catch(e => console.error(e));
    }, []);

    // SIREN LOGIC - Managed globally by GlobalAdminNotifications.jsx

    const sendWhatsAppAlert = (order, type = 'admin') => {
        let phone = waSettings?.adminPhone || '918762037422';

        if (type === 'restaurant') {
            phone = order.restaurantPhone;
            if (!phone) return alert('Restaurant WhatsApp number not found');
        }

        const text = `🚨 *New Order Received!*
Order ID: ${order._id.slice(-6).toUpperCase()}
Amount: ₹${order.totalAmount}
Payment: ${order.paymentStatus} (${order.paymentMethod || 'Unknown'})
Customer Area: ${order.address?.area || order.user?.address?.area || 'N/A'}
Distance: ${order.deliveryDistance ? order.deliveryDistance.toFixed(1) + ' KM' : 'N/A'}
Type: ${order.items.length} Items

Link: https://www.foodriders.in/admin/orders`;

        const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    // Auto-play siren for pending orders
    // Siren managed globally

    // Sync Mute State
    useEffect(() => {
        const syncMute = () => setIsMuted(localStorage.getItem('isMuted') === 'true');
        window.addEventListener('storage', syncMute);
        window.addEventListener('mute-local-event', syncMute);
        return () => {
            window.removeEventListener('storage', syncMute);
            window.removeEventListener('mute-local-event', syncMute);
        };
    }, []);

    const handleMute = () => {
        const newVal = !isMuted;
        setIsMuted(newVal);
        localStorage.setItem('isMuted', newVal);
        window.dispatchEvent(new Event('mute-local-event'));
        // Global listener will handle stop
    };

    // DEBUG: Check if logic is triggering
    useEffect(() => {
        const pending = orders.filter(o => ['PENDING_ACCEPTANCE', 'CREATED', 'PAYMENT_PENDING', 'USER_MARKED_PAID'].includes(o.status) || ['PENDING_ACCEPTANCE', 'CREATED', 'PAYMENT_PENDING', 'USER_MARKED_PAID'].includes(o.orderStatus));
        if (pending.length > 0) {
            console.log(`🚨 [DEBUG] ${pending.length} Pending Orders Found. Siren logic should trigger. Muted:`, isMuted);
        }
    }, [orders, isMuted]);

    // Auto-scroll to highlighted order from URL (e.g. /admin/orders/:orderId)
    useEffect(() => {
        if (highlightOrderId && orders.length > 0 && highlightRef.current) {
            highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [highlightOrderId, orders]);

    useEffect(() => {
        fetchOrders();
        fetchPartners();

        // Socket.io for Real-time Updates
        const connectSocket = () => {
            if (!socket.connected) socket.connect();
            socket.emit('joinRole', 'admin');
            socket.emit('join-admin-room');
        };

        connectSocket();

        const handleNewOrder = (data) => {
            console.log('🚨 NEW ORDER SOCKET RECEIVED:', data?.order?._id);
            // Siren managed globally

            if (data.order) {
                setOrders(prev => {
                    const exists = prev.find(o => o._id === data.order._id);
                    if (exists) return prev;
                    return [data.order, ...prev];
                });
            }
        };

        const handleUpdate = (updatedOrder) => {
            if (!updatedOrder || !updatedOrder._id) return;
            setOrders(prev => {
                if (!Array.isArray(prev)) return [updatedOrder];
                const index = prev.findIndex(o => o._id === updatedOrder._id);
                if (index !== -1) {
                    const newOrders = [...prev];
                    newOrders[index] = updatedOrder;
                    return newOrders;
                } else {
                    return [updatedOrder, ...prev];
                }
            });
        };

        const handleConnect = () => {
            console.log('🔌 Socket Connected - Joining Admin Room');
            socket.emit('joinAdmin');
            fetchOrders();
        };

        socket.on('connect', handleConnect);
        socket.on('newOrder', handleNewOrder);
        socket.on('adminOrderUpdate', handleUpdate);
        socket.on('orderUpdated', handleUpdate); // Centralized Event (Step 6)

        // Slow fallback sweep
        const interval = setInterval(() => {
            fetchOrders();
        }, 30000);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('newOrder', handleNewOrder);
            socket.off('adminOrderUpdate', handleUpdate);
            socket.off('orderUpdated', handleUpdate);
            clearInterval(interval);
        };
    }, []);

    // Automatically mark as seen after 5 seconds of being displayed
    useEffect(() => {
        const pendingOrders = orders.filter(o => !o.isAdminSeen && ['PENDING_ACCEPTANCE', 'CREATED', 'PAYMENT_PENDING', 'USER_MARKED_PAID'].includes(o.status || o.orderStatus));
        if (pendingOrders.length > 0) {
            const timer = setTimeout(() => {
                const token = localStorage.getItem('adminToken');
                pendingOrders.forEach(order => {
                    fetch(`/api/orders/${order._id}/seen`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).catch(e => console.error('Seen Error', e));
                });
                // Update local state to avoid re-triggering
                setOrders(prev => prev.map(o => {
                    if (pendingOrders.find(po => po._id === o._id)) {
                        return { ...o, isAdminSeen: true };
                    }
                    return o;
                }));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [orders]);

    const fetchPartners = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch('/api/admin/delivery-partners', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setPartners(data);
        } catch (err) { }
    };

    const fetchOrders = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            console.log('[DEBUG] Fetching admin orders from:', '/api/orders/admin?liveOnly=true');
            const res = await fetch('/api/orders/admin?liveOnly=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`[DEBUG] Fetch Error: ${res.status} ${res.statusText}`, errorText);
                setError(`Server Error: ${res.status} ${res.statusText}`);
                return;
            }

            const data = await res.json();
            console.log('[DEBUG] Admin orders received:', data);

            if (data.success && Array.isArray(data.orders)) {
                setOrders(data.orders);
                setError(null);
            } else {
                setError(data.message || 'Failed to load orders');
            }
        } catch (err) {
            console.error('[DEBUG] Fetch Exception:', err);
            setError(`Connection Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId, newStatus, reason = '') => {
        const token = localStorage.getItem('adminToken');
        setActionLoading(orderId);
        try {
            // ✅ Centralized Status Update API (Step 3)
            const res = await fetch('/api/orders/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ orderId, status: newStatus, reason })
            });
            const data = await res.json();
            if (data.success) {
                // UI state will be updated via socket (handleUpdate)
                setShowCancelModal(false);
                setCancellingOrder(null);
                setCancelReason('');
            } else {
                alert(data.message || 'Failed to update status');
            }
        } catch (err) {
            alert('Connection error');
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleAssign = async (orderId, partnerId) => {
        const token = localStorage.getItem('adminToken');
        if (!partnerId) return;
        try {
            // ✅ Centralized Status Update API (Step 3)
            const res = await fetch('/api/orders/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ orderId, status: 'ASSIGNED', deliveryBoyId: partnerId })
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || 'Failed to assign partner');
            }
        } catch (err) {
            alert('Connection error');
            console.error(err);
        }
    };

    const handleSendInstructions = async (orderId) => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`/api/orders/${orderId}/send-payment-instructions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            alert(data.message || 'Instructions sent');
        } catch (err) {
            alert('Connection error');
            console.error(err);
        }
    };

    const handleConfirmPayment = async (orderId) => {
        const token = localStorage.getItem('adminToken');
        try {
            // ✅ Centralized Status Update API
            const res = await fetch('/api/orders/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ orderId, status: 'ACCEPTED' }) // Move to accepted after payment
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || 'Failed to confirm payment');
            }
        } catch (err) {
            alert('Connection error');
        }
    };

    const handleRejectPayment = async (orderId) => {
        const reason = prompt('Reason for rejection:');
        if (!reason) return;
        const token = localStorage.getItem('adminToken');
        try {
            // ✅ Centralized Status Update API
            await fetch('/api/orders/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ orderId, status: 'PENDING_ACCEPTANCE', reason })
            });
            alert('Payment rejected. User notified.');
        } catch (err) {
            alert('Connection error');
            console.error(err);
        }
    };

    const handleRazorpayRefund = async (orderId, amount = null) => {
        if (!window.confirm('Are you sure you want to refund this order via Razorpay?')) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch('/api/payment/razorpay/refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ orderId, amount })
            });
            const data = await res.json();
            if (data.success) {
                fetchOrders();
                alert('Refund processed successfully!');
            } else {
                alert(data.msg || 'Refund failed');
            }
        } catch (err) {
            alert('Connection error');
            console.error(err);
        }
    };

    const handleMarkCashCollected = async (orderId) => {
        const token = localStorage.getItem('adminToken');
        try {
            // ✅ Centralized Status Update API
            const res = await fetch('/api/orders/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ orderId, status: 'DELIVERED' }) // Marking cash as collected usually means it's delivered
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || 'Failed to mark cash collected');
            }
        } catch (err) {
            alert('Connection error');
        }
    };

    const handleClearLive = async () => {
        const visibleOrders = Array.isArray(orders) ? orders : [];
        const toClear = visibleOrders.filter(o =>
            ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.status) ||
            (o.paymentStatus === 'USER_MARKED_PAID' && o.status === 'DELIVERED')
        );

        if (toClear.length === 0) {
            alert("No completed or cancelled orders to clear.");
            return;
        }

        if (window.confirm(`Clear ${toClear.length} completed/cancelled orders from this Live View? (They will still be in History)`)) {
            try {
                const token = localStorage.getItem('adminToken');
                const orderIds = toClear.map(o => o._id);

                const res = await fetch('/api/orders/admin/clear-live', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ orderIds })
                });
                const data = await res.json();
                if (data.success) {
                    // Update UI instantly by removing them locally or refetching
                    fetchOrders();
                    alert(data.message);
                } else {
                    alert(data.message || 'Failed to clear');
                }
            } catch (err) {
                console.error(err);
                alert('Connection error while clearing orders');
            }
        }
    };

    const isAdmin = localStorage.getItem('role') === 'admin' || localStorage.getItem('adminRole') === 'ADMIN';

    if (loading) return <AdminLayout><div style={{ padding: '2rem', textAlign: 'center' }}>Loading live orders...</div></AdminLayout>;

    // Filter Logic
    // Filter Logic: Orders are already filtered by backend (?liveOnly=true)
    const visibleOrders = Array.isArray(orders) ? orders : [];

    return (
        <AdminLayout>
            <div className={css.ordersWrapper}>
                <header className={css.header} style={{ position: 'sticky', top: 0, zIndex: 99, background: 'var(--bg-main)', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className={css.headerLeft}>
                        <h3>Live Monitor</h3>
                        <div className={css.statsBadges}>
                            <span className={css.badge} style={{ background: '#2ecc7120', color: '#27ae60' }}>
                                {visibleOrders.filter(o => ['ACCEPTED', 'ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'].includes(o.status)).length} ACTIVE
                            </span>
                            <span className={css.badge} style={{ background: '#e74c3c20', color: '#c0392b' }}>
                                {visibleOrders.filter(o => ['PENDING_ACCEPTANCE', 'CREATED', 'PAYMENT_PENDING', 'USER_MARKED_PAID'].includes(o.orderStatus || o.status)).length} PENDING
                            </span>
                        </div>
                    </div>

                    <div className={css.headerActions}>
                        <MuteButton onMute={handleMute} isMuted={isMuted} />
                        <button className={css.clearBtn} onClick={handleClearLive} title="Clear Completed">
                            🧹 Clear Done
                        </button>
                        <button className={css.historyBtn} onClick={() => window.location.href = '/admin/orders/history'}>
                            📜 History
                        </button>
                    </div>
                </header>

                {error && <div className={css.errorBanner}>{error}</div>}

                <div className={css.orderGrid}>
                    {visibleOrders.length === 0 ? (
                        <div className={css.emptyState}>
                            <img src="/icons/package.png" alt="Empty" style={{ opacity: 0.3, width: '64px' }} />
                            <p>No active orders visible.</p>
                        </div>
                    ) : (
                        visibleOrders.map(order => {
                            // Pulsing for new orders that need action (Acknowledgment or Assignment)
                            // Pulsing for new orders that need action
                            const isPending = ['PENDING_ACCEPTANCE', 'CREATED', 'PAYMENT_PENDING', 'USER_MARKED_PAID'].includes(order.orderStatus || order.status);
                            const isHighlighted = highlightOrderId && order._id === highlightOrderId;
                            return (
                                <div
                                    key={order._id}
                                    ref={isHighlighted ? highlightRef : null}
                                    className={`${css.orderCard} ${isPending ? css.pulsingCard : ''}`}
                                    style={isHighlighted ? { border: '3px solid #f39c12', boxShadow: '0 0 20px rgba(243,156,18,0.4)' } : {}}
                                >
                                    {['PENDING_ACCEPTANCE', 'CREATED', 'PAYMENT_PENDING', 'USER_MARKED_PAID'].includes(order.orderStatus || order.status) && <div className={css.newBadge}>NEW</div>}
                                    <div className={css.orderHeader}>
                                        <span className={css.orderId}>#{order._id.slice(-6).toUpperCase()}</span>
                                        <div className={css.restaurantInfo}>
                                            <span className={css.restaurantTag}>🏬 {order.restaurantName || 'Unknown Hotel'}</span>
                                            {order.restaurantAddress && (
                                                <span className={css.restaurantAddr}>{order.restaurantAddress}</span>
                                            )}
                                        </div>
                                        <span className={css.timeStamp}>{new Date(order.createdAt).toLocaleTimeString()}</span>
                                    </div>

                                    {order.scheduled_at && (
                                        <div className={css.scheduledBadge}>
                                            ⏰ Scheduled: {new Date(order.scheduled_at).toLocaleString('en-IN', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    )}

                                    {(order.acceptedAt || order.assignedAt) && (
                                        <div style={{ fontSize: '11px', color: '#636e72', margin: '8px 15px', padding: '4px 10px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee', fontWeight: 'bold' }}>
                                            🛵 Rider Received: {new Date(order.acceptedAt || order.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}

                                    <div className={css.customerInfo}>
                                        <div className={css.customerName}>{order.userDetails?.name || 'Guest User'}</div>
                                        <div className={css.customerAddr}>{order.userDetails?.address}</div>
                                        <div className={css.contactActions}>
                                            <a href={`tel:${order.userDetails?.phone}`} className={css.callBtn}>
                                                <img src="/icons/smartphone.png" alt="Call" className={css.callIcon} />
                                                Call Customer
                                            </a>
                                            <span className={`${css.badge} ${order.paymentStatus === 'PAID' ? css.paid : ((order.paymentMethod === 'COD' && order.orderStatus !== 'DELIVERED') ? css.codPending : css.failed)}`}>
                                                {order.paymentStatus} • {order.paymentMethod}
                                            </span>
                                        </div>
                                    </div>

                                    {order.paymentScreenshot && (
                                        <div style={{
                                            margin: '10px 15px', padding: '12px',
                                            background: 'linear-gradient(135deg, rgba(46, 213, 115, 0.1), rgba(52, 152, 219, 0.08))',
                                            border: '1.5px solid rgba(46, 213, 115, 0.3)', borderRadius: '14px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                <span style={{ fontSize: '1.2rem' }}>🖼️</span>
                                                <span style={{ fontWeight: 900, fontSize: '0.8rem', color: '#2ed573', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Payment Proof Received</span>
                                            </div>
                                            <img
                                                src={order.paymentScreenshot.startsWith('http') ? order.paymentScreenshot : `${backendUrl}${order.paymentScreenshot}`}
                                                alt="Payment Screenshot"
                                                onClick={() => window.open(order.paymentScreenshot.startsWith('http') ? order.paymentScreenshot : `${backendUrl}${order.paymentScreenshot}`, '_blank')}
                                                style={{
                                                    width: '100%', maxHeight: '180px', objectFit: 'contain',
                                                    borderRadius: '10px', cursor: 'pointer', background: '#fff',
                                                    border: '1px solid #dfe6e9', transition: 'all 0.3s'
                                                }}
                                                onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                            />
                                            <div style={{ textAlign: 'center', marginTop: '8px' }}>
                                                <a
                                                    href={order.paymentScreenshot.startsWith('http') ? order.paymentScreenshot : `${backendUrl}${order.paymentScreenshot}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#2ed573', fontSize: '0.7rem', fontWeight: 800, textDecoration: 'none' }}
                                                >
                                                    🔍 TAP TO VIEW FULL SCREEN
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    <ul className={css.itemList}>
                                        {order.items.map((item, idx) => (
                                            <li key={idx} className={css.itemRow}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span>{item.name} x {item.quantity}</span>
                                                    {item.adjustmentApplied && (
                                                        <small style={{ color: '#2ED573', fontSize: '0.75rem', fontWeight: 600 }}>
                                                            Base: ₹{item.basePrice} ({item.adjustmentApplied.amount > 0 ? '+' : ''}{item.adjustmentApplied.amount}{item.adjustmentApplied.type === 'percentage' ? '%' : ''})
                                                        </small>
                                                    )}
                                                </div>
                                                <span>₹{item.price * item.quantity}</span>
                                            </li>
                                        ))}
                                        {order.deliveryDistance > 0 && (
                                            <li className={css.itemRow}>
                                                <span>Delivery ({order.deliveryDistance.toFixed(1)} KM)</span>
                                                <span>₹{order.deliveryCharge || 0}</span>
                                            </li>
                                        )}
                                        <li className={css.itemRow}>
                                            <span>Platform Fee</span>
                                            <span>₹{order.platformFee || 0}</span>
                                        </li>
                                        {order.packagingCharge > 0 && (
                                            <li className={css.itemRow}>
                                                <span>Packaging Charge</span>
                                                <span>₹{order.packagingCharge || 0}</span>
                                            </li>
                                        )}
                                        {order.extraCharges?.map((ec, idx) => (
                                            <li key={`ec-${idx}`} className={css.itemRow} style={{ color: '#8e44ad', fontWeight: 600 }}>
                                                <span>{ec.name}</span>
                                                <span>₹{ec.amount}</span>
                                            </li>
                                        ))}
                                        {order.tipAmount > 0 && (
                                            <li className={css.itemRow}>
                                                <span>Delivery Tip</span>
                                                <span>₹{order.tipAmount}</span>
                                            </li>
                                        )}
                                        {order.couponDiscount > 0 && (
                                            <li className={css.itemRow} style={{ color: '#2ed573', fontWeight: 600 }}>
                                                <span>Coupon Discount</span>
                                                <span>-₹{order.couponDiscount}</span>
                                            </li>
                                        )}
                                        {order.walletAmountUsed > 0 && (
                                            <li className={css.itemRow} style={{ color: '#ff4757', fontWeight: 600 }}>
                                                <span>Wallet Credit Used</span>
                                                <span>-₹{order.walletAmountUsed}</span>
                                            </li>
                                        )}

                                        {/* Simplified bill view, primary proof above */}
                                        <li className={css.itemTotal}>
                                            <span>Total Amount</span>
                                            <span>₹{order.totalAmount}</span>
                                        </li>
                                    </ul>

                                    {order.order_notes && (
                                        <div className={css.notesHighlight}>
                                            📝 <strong>Note:</strong> {order.order_notes}
                                        </div>
                                    )}

                                    <div className={css.statusContainer}>
                                        {/* STATUS ACTION BUTTONS */}
                                        {order.paymentStatus !== 'PAID' && (
                                            <div className={css.claimAlert} style={{ marginBottom: '1rem', background: '#f39c12', color: 'white' }}>
                                                ⏳ PAYMENT NOT RECEIVED
                                            </div>
                                        )}
                                        {(!waSettings || waSettings.enabled) && (
                                            <div style={{ display: 'flex', gap: '5px', marginBottom: '0.5rem' }}>
                                                <button
                                                    style={{ flex: 1, background: '#25D366', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.9rem' }}
                                                    onClick={() => sendWhatsAppAlert(order, 'admin')}
                                                    title="Send to Admin"
                                                >
                                                    <span>💬</span> Admin
                                                </button>
                                                {order.restaurantPhone && order.restaurantWaEnabled !== false && (
                                                    <button
                                                        style={{ flex: 1, background: '#128C7E', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.9rem' }}
                                                        onClick={() => sendWhatsAppAlert(order, 'restaurant')}
                                                        title="Send to Restaurant"
                                                    >
                                                        <span>🏪</span> Rest.
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {/* Dynamic Status Actions (Target 3) */}
                                        {['PENDING_ACCEPTANCE', 'CREATED', 'PAYMENT_PENDING', 'USER_MARKED_PAID'].includes(order.orderStatus || order.status) && (
                                            <button
                                                className={css.bigBtnConfirm}
                                                onClick={() => handleUpdateStatus(order._id, 'ACCEPTED')}
                                                disabled={actionLoading === order._id || (order.paymentMethod === 'RAZORPAY' && order.paymentStatus !== 'PAID')}
                                                style={{
                                                    background: (order.paymentMethod === 'RAZORPAY' && order.paymentStatus !== 'PAID') ? '#95a5a6' : '#2ecc71',
                                                    marginBottom: '5px'
                                                }}
                                            >
                                                {actionLoading === order._id ? 'Processing...' : (order.paymentMethod === 'RAZORPAY' && order.paymentStatus !== 'PAID' ? '🔒 Awaiting Payment' : '✅ Accept Order')}
                                            </button>
                                        )}

                                        {order.orderStatus === 'ACCEPTED' && (
                                            <button
                                                className={css.bigBtnConfirm}
                                                onClick={() => handleUpdateStatus(order._id, 'PREPARING')}
                                                disabled={actionLoading === order._id}
                                                style={{ background: '#3498db' }}
                                            >
                                                {actionLoading === order._id ? '...' : '🍳 Start Preparing'}
                                            </button>
                                        )}

                                        {order.orderStatus === 'PREPARING' && (
                                            <button
                                                className={css.bigBtnConfirm}
                                                onClick={() => handleUpdateStatus(order._id, 'READY_FOR_PICKUP')}
                                                disabled={actionLoading === order._id}
                                                style={{ background: '#f1c40f', color: '#000' }}
                                            >
                                                {actionLoading === order._id ? '...' : '🛎️ Mark Ready for Pickup'}
                                            </button>
                                        )}

                                        {order.orderStatus === 'PICKED_UP' && (
                                            <button
                                                className={css.bigBtnConfirm}
                                                onClick={() => handleUpdateStatus(order._id, 'OUT_FOR_DELIVERY')}
                                                disabled={actionLoading === order._id}
                                                style={{ background: '#e67e22' }}
                                            >
                                                {actionLoading === order._id ? '...' : '📍 Out for Delivery'}
                                            </button>
                                        )}

                                        {order.orderStatus === 'OUT_FOR_DELIVERY' && (
                                            <button
                                                className={css.bigBtnConfirm}
                                                onClick={() => handleUpdateStatus(order._id, 'DELIVERED')}
                                                disabled={actionLoading === order._id}
                                                style={{ background: '#27ae60' }}
                                            >
                                                {actionLoading === order._id ? '...' : '🏁 Mark Delivered'}
                                            </button>
                                        )}

                                        {/* Show status text if no action needed */}
                                        {['READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'].includes(order.orderStatus) && (
                                            <div className={css.statusLabelMain}>
                                                {order.orderStatus === 'READY_FOR_PICKUP' && (
                                                    <span style={{ color: '#e67e22' }}>🕙 READY: Assign Rider 👇</span>
                                                )}
                                                {order.orderStatus === 'ASSIGNED' && (
                                                    <span style={{ color: '#3498db', fontWeight: 700 }}>⏳ WAITING FOR RIDER PICKUP</span>
                                                )}
                                                {order.orderStatus === 'PICKED_UP' && (
                                                    <span style={{ color: '#9b59b6', fontWeight: 700 }}>📦 ORDER PICKED UP</span>
                                                )}
                                                {order.orderStatus === 'OUT_FOR_DELIVERY' && (
                                                    <span className={css.onTheWayPulse} style={{ fontWeight: 700 }}>📍 OUT FOR DELIVERY</span>
                                                )}
                                                {order.orderStatus === 'DELIVERED' && (
                                                    <span style={{ color: '#2ecc71', fontWeight: 800 }}>🎉 DELIVERED</span>
                                                )}
                                                {order.orderStatus === 'CANCELLED' && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span style={{ color: '#e74c3c', fontWeight: 800 }}>❌ CANCELLED</span>
                                                        {order.rejectReason && (
                                                            <span style={{ fontSize: '0.7rem', color: '#666', background: '#fff5f5', padding: '2px 8px', borderRadius: '4px', border: '1px dashed #feb2b2' }}>
                                                                Reason: {order.rejectReason}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* CANCEL OPTION */}
                                        {/* CANCEL OPTION (Target 3) */}
                                        {['PENDING_ACCEPTANCE', 'CREATED', 'PAYMENT_PENDING', 'USER_MARKED_PAID', 'PENDING_COD', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED'].includes(order.orderStatus || order.status) && (
                                            <button
                                                className={css.smallBtnCancel}
                                                onClick={() => {
                                                    setCancelReason('');
                                                    setCancellingOrder(order);
                                                    setShowCancelModal(true);
                                                }}
                                                style={{ marginTop: '10px', width: '100%', border: '1px solid #ff4d4d', color: '#ff4d4d' }}
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                    </div>

                                    {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED' && (
                                        <div className={css.statusContainer} style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                                            <label className={css.statusLabel}>🚀 Dispatch Logistics</label>
                                            <select
                                                id={`partnerSelect-${order._id}`}
                                                className={css.statusSelector}
                                                value={typeof order.deliveryBoyId === 'object' ? order.deliveryBoyId?._id : (order.deliveryBoyId || '')}
                                                onChange={(e) => handleAssign(order._id, e.target.value)}
                                                disabled={order.orderStatus !== 'READY_FOR_PICKUP' || order.orderStatus === 'ASSIGNED'}
                                                style={{
                                                    borderColor: order.deliveryBoyId ? '#00d2ff' : '#ccc',
                                                    opacity: (order.orderStatus !== 'READY_FOR_PICKUP' || order.orderStatus === 'ASSIGNED') ? 0.5 : 1
                                                }}
                                            >
                                                <option value="">{order.orderStatus === 'ASSIGNED' ? 'RIDER ASSIGNED' : 'Select Delivery Partner'}</option>
                                                {partners.map(p => (
                                                    <option key={p._id} value={p._id}>{p.fullName} ({p.mobile})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Action buttons - Hidden if Cancelled or Delivered to avoid confusion */}
                                    {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED' && (
                                        <div className={css.actionStrip}>
                                            {order.paymentMode === 'UPI_MANUAL' && order.paymentStatus !== 'ADMIN_CONFIRMED' && order.paymentStatus !== 'PAID' && (
                                                <>
                                                    <button
                                                        className={`${css.actionBtn} ${css.upiBtn}`}
                                                        onClick={() => handleSendInstructions(order._id)}
                                                    >
                                                        Send QR
                                                    </button>
                                                    <button
                                                        className={`${css.actionBtn} ${css.confirmBtn}`}
                                                        onClick={() => handleConfirmPayment(order._id)}
                                                    >
                                                        Confirm Payment
                                                    </button>
                                                    <button
                                                        className={`${css.actionBtn} ${css.rejectBtn}`}
                                                        onClick={() => handleRejectPayment(order._id)}
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}

                                            {order.paymentMode === 'COD' && order.paymentStatus !== 'PAID' && order.paymentStatus !== 'ADMIN_CONFIRMED' && (
                                                <button
                                                    className={`${css.actionBtn} ${css.confirmBtn}`}
                                                    onClick={() => handleMarkCashCollected(order._id)}
                                                >
                                                    ✅ Mark Cash Collected
                                                </button>
                                            )}

                                            {order.paymentMode === 'RAZORPAY' && order.paymentStatus === 'PAID' && (
                                                <button
                                                    className={`${css.actionBtn} ${css.rejectBtn}`}
                                                    onClick={() => handleRazorpayRefund(order._id)}
                                                    style={{ background: '#e67e22' }}
                                                >
                                                    💸 Refund Razorpay
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Chat button always visible for support */}
                                    <div className={css.actionStrip} style={{ marginTop: '0.5rem' }}>
                                        <button
                                            className={`${css.actionBtn} ${css.chatBtn}`}
                                            onClick={() => setActiveChatId(activeChatId === order._id ? null : order._id)}
                                            style={order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED' ? { flex: 2, background: '#f39c12', padding: '0.8rem' } : {}}
                                        >
                                            {activeChatId === order._id ? 'Close Chat' : (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                    <span>Support Chat {order.orderStatus === 'DELIVERED' ? ' (Done)' : ''}{order.orderStatus === 'CANCELLED' ? ' (Cancelled)' : ''}</span>
                                                    {(() => {
                                                        const msgs = order.messages || [];
                                                        let count = 0;
                                                        for (let i = msgs.length - 1; i >= 0; i--) {
                                                            if (msgs[i].sender !== 'admin') count++;
                                                            else break;
                                                        }
                                                        return count > 0 ? <span className={css.msgBadge}>{count}</span> : null;
                                                    })()}
                                                </div>
                                            )}
                                        </button>
                                    </div>

                                    {/* Chat is handled by global overlay at bottom */}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Premium Fullscreen Admin Chat Overlay */}
            <AnimatePresence>
                {activeChatId && (
                    <motion.div
                        className={css.fullscreenChatOverlay}
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        <Chat
                            orderId={activeChatId}
                            userRole="admin"
                            userName="FoodRiders Support"
                            userImage="/Logo-Img.png"
                            onClose={() => setActiveChatId(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cancellation Reason Modal */}
            {showCancelModal && (
                <div className={css.modalOverlay}>
                    <div className={css.modalContent}>
                        <h3 className={css.modalTitle}>🚫 Cancel Order</h3>
                        <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Order: <span style={{ color: '#ed1c24', fontWeight: 'bold' }}>#{cancellingOrder?._id.slice(-6).toUpperCase()}</span>
                        </p>

                        <div className={css.reasonTemplateGrid}>
                            {[
                                'Store Closed',
                                'Items Out of Stock',
                                'Driver Unavailable',
                                'Technical Issue',
                                'Outside Delivery Radius',
                                'Incomplete Address'
                            ].map(template => (
                                <button
                                    key={template}
                                    type="button"
                                    className={`${css.templateBtn} ${cancelReason === template ? css.templateBtnActive : ''}`}
                                    onClick={() => setCancelReason(template)}
                                >
                                    {template}
                                </button>
                            ))}
                        </div>

                        <textarea
                            className={css.customReasonField}
                            placeholder="Type a custom reason here..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />

                        <div className={css.modalActions}>
                            <button
                                className={css.cancelModalBtn}
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancellingOrder(null);
                                    setCancelReason('');
                                }}
                            >
                                Back
                            </button>
                            <button
                                className={css.confirmCancelBtn}
                                onClick={() => {
                                    console.log('Final Cancel Reason being sent:', cancelReason);
                                    handleUpdateStatus(cancellingOrder._id, 'CANCELLED', cancelReason);
                                }}
                            >
                                Confirm Cancellation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminOrders;
