import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import css from './DeliveryDashboard.module.css';
import socket from '../../utils/socket';
import Chat from '../../components/Chat.jsx';
import { useDeliveryNotifications } from '../../hooks/useNotificationSounds';
import MuteButton from '../../components/Common/MuteButton';

import { motion, AnimatePresence } from 'framer-motion';
import useFCM from '../../hooks/useFCM';

const DeliveryDashboard = () => {
    const { permissionStatus, requestPermission } = useFCM();
    const [activeTab, setActiveTab] = useState('active'); // active, history, profile
    const [orders, setOrders] = useState({ active: [], history: [] });
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [activeChatId, setActiveChatId] = useState(null);
    const [isMuted, setIsMuted] = useState(localStorage.getItem('isMuted') === 'true');
    const [actionLoading, setActionLoading] = useState(null); // Track loading state for buttons
    const [finalizingOrder, setFinalizingOrder] = useState(null); // Order currently being finalized
    const [paymentOption, setPaymentOption] = useState('CASH'); // CASH or UPI
    const [paymentSettings, setPaymentSettings] = useState(null);
    const [assignmentOrder, setAssignmentOrder] = useState(null); // FIX 1: New assignment popup state
    const audioRef = React.useRef(new Audio("/notification.mp3")); // FIX 1: Notification sound
    const navigate = useNavigate();

    // Auto-play siren for ready orders
    // Pass orders.active array and user ID
    const { stopDeliverySiren, playDeliverySiren } = useDeliveryNotifications(orders.active, user?._id || user?.id, isMuted);

    const handleMute = () => {
        const newState = !isMuted;
        setIsMuted(newState);
        localStorage.setItem('isMuted', newState);
        if (newState) stopDeliverySiren();
    };

    useEffect(() => {
        const token = localStorage.getItem('deliveryToken');
        const userData = localStorage.getItem('deliveryUser');
        if (!token) {
            navigate('/delivery-login');
            return;
        }
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchOrders();

        // Socket.io for Real-time Updates (Rule 5 & 7)
        if (!socket.connected) socket.connect();

        const riderId = parsedUser.id || parsedUser._id;
        // FIX 1: Step 1 - Ensure Rider Joins Correct Room
        if (riderId) {
            socket.emit("joinRider", riderId);
            console.log(`[SOCKET] Rider joined: rider_${riderId}`);
        }

        const handleIncomingUpdate = (updatedOrder) => {
            console.log('🔔 Rider Dashboard Update:', updatedOrder._id, updatedOrder.orderStatus);
            fetchOrders();
        };

        socket.on('orderUpdated', handleIncomingUpdate); // Centralized Event (Step 5)
        socket.on('orderUpdate', handleIncomingUpdate);
        socket.on('riderStatusUpdate', handleIncomingUpdate);
        // FIX 1: Step 4 - Rider Frontend Listener
        socket.on("newAssignment", (order) => {
            console.log('🏁 NEW ASSIGNMENT RECEIVED:', order._id);
            setAssignmentOrder(order);
            audioRef.current.play().catch(e => console.log("Audio play blocked", e));
            fetchOrders();
        });

        socket.on('deliveryAssigned', handleIncomingUpdate);

        // Initialize stable data
        fetch('/api/payment-settings')
            .then(res => res.json())
            .then(data => setPaymentSettings(data))
            .catch(err => console.error('Settings fetch error:', err));


        return () => {
            socket.off('orderUpdated');
            socket.off('orderUpdate');
            socket.off('riderStatusUpdate');
            socket.off('newAssignment');
            socket.off('deliveryAssigned');
            socket.disconnect();
        };
    }, [navigate]);

    // Separate Effect for GPS Tracking to avoid infinite loops and keep state fresh
    useEffect(() => {
        let geoInterval;
        const token = localStorage.getItem('deliveryToken');
        if ("geolocation" in navigator && token) {
            geoInterval = setInterval(() => {
                const activeDeliveries = orders.active.filter(o =>
                    ['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status || o.orderStatus)
                );
                if (activeDeliveries.length > 0) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                        const { latitude, longitude } = pos.coords;
                        fetch('/api/delivery/location', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ lat: latitude, lng: longitude })
                        }).catch(() => { });

                        activeDeliveries.forEach(order => {
                            socket.emit('updateLocation', {
                                orderId: order._id,
                                location: { lat: latitude, lng: longitude }
                            });
                        });
                    }, (err) => console.warn('GPS Error:', err), { enableHighAccuracy: true });
                }
            }, 5000);
        }
        return () => { if (geoInterval) clearInterval(geoInterval); };
    }, [orders.active]);


    const fetchOrders = async () => {
        const token = localStorage.getItem('deliveryToken');
        try {
            const res = await fetch('/api/delivery/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                handleLogout();
                return;
            }
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('deliveryToken');
        localStorage.removeItem('deliveryUser');
        navigate('/delivery-login');
    };

    const updateStatus = async (orderId, currentStatus, finalCnf = false) => {
        const order = orders.active.find(o => o._id === orderId);
        const flow = {
            'ASSIGNED': 'ACCEPTED',
            'ACCEPTED': 'PICKED_UP',
            'PICKED_UP': 'OUT_FOR_DELIVERY',
            'OUT_FOR_DELIVERY': 'DELIVERED',
            'ARRIVING': 'DELIVERED'
        };
        const nextStatus = flow[currentStatus];

        if (!nextStatus || actionLoading === orderId) return;

        // Special handling for COD completion
        if (nextStatus === 'DELIVERED' && order?.paymentMethod === 'COD' && !finalCnf) {
            setFinalizingOrder(order);
            return;
        }

        setActionLoading(orderId);
        const token = localStorage.getItem('deliveryToken');
        try {
            // ✅ Centralized Status Update API (Step 3)
            const res = await fetch('/api/orders/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ orderId, status: nextStatus })
            });
            const data = await res.json();
            if (data.success) {
                setFinalizingOrder(null);
                // UI updates via socket
            } else {
                alert(data.message || 'Update failed');
            }
        } catch (err) {
            alert('Error updating status');
        } finally {
            setActionLoading(null);
        }
    };

    const getStepConfig = (status) => {
        switch (status) {
            case 'ASSIGNED': return { label: 'ACCEPT ORDER', step: 1, total: 4, description: 'Confirm you are available' };
            case 'ACCEPTED':
            case 'READY_FOR_PICKUP': return { label: 'PICKED UP', step: 2, total: 4, description: 'Collect food from restaurant' };
            case 'PICKED_UP':
            case 'OUT_FOR_DELIVERY': return { label: 'REACHED LOCATION', step: 3, total: 4, description: 'Mark when at customer house' };
            case 'ARRIVING': return { label: 'DELIVERED', step: 4, total: 4, description: 'Hand over food to customer' };
            default: return null;
        }
    };

    const calculateEarnings = () => {
        return orders.history.reduce((acc, order) => acc + (order.deliveryCharge || 40), 0);
    };

    return (
        <div className={css.container}>
            <header className={css.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className={css.brand}>
                        <span className={css.logo}>FOODRIDERS</span>
                        <div className={css.riderBadge}>Fleet Partner</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MuteButton onMute={handleMute} isMuted={isMuted} label="Mute Alert" />
                    <div className={css.profileInfo} onClick={() => setActiveTab('profile')}>
                        <span className={css.headerName}>{user?.name?.split(' ')[0]}</span>
                        <div className={css.avatar}>
                            {user?.profilePic ? (
                                <img src={user.profilePic} alt="Profile" className={css.headerAvatarImg} />
                            ) : (
                                user?.name?.charAt(0)
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className={css.content}>
                <div className={css.welcomeSection}>
                    <h1>Hello, {user?.name || 'Rider'}! 👋</h1>
                    <p>{orders.active.length > 0 ? "You have a pending delivery." : "Ready for new assignments?"}</p>
                </div>

                {permissionStatus !== 'granted' && (
                    <motion.div
                        className={css.permissionBanner}
                        onClick={requestPermission}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {permissionStatus === 'denied'
                            ? "🚨 Notifications blocked! Deliveries may be missed. Enable in settings."
                            : "🚚 Receive real-time orders? Click here to ENABLE alerts."}
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {activeTab === 'active' && (
                        <motion.section
                            key="active"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <h2 className={css.sectionTitle}>Active Assignment</h2>
                            {loading ? <div className={css.loader}>Checking for tasks...</div> : (
                                <div className={css.orderList}>
                                    {orders.active.length === 0 ? (
                                        <motion.div
                                            className={css.emptyState}
                                            initial={{ scale: 0.9 }}
                                            animate={{ scale: 1 }}
                                        >
                                            <div className={css.emptyIcon}>🛵</div>
                                            <p>No active orders</p>
                                            <span>New assignments will reflect here.</span>
                                        </motion.div>
                                    ) : (
                                        orders.active.map(order => (
                                            <motion.div
                                                key={order._id}
                                                className={css.activeOrderCard}
                                                layout
                                            >
                                                <div className={css.cardHeader}>
                                                    <span className={css.orderId}>#{order._id.slice(-6).toUpperCase()}</span>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span className={`${css.statusBadge} ${css[order.orderStatus.toLowerCase()]}`}>
                                                            {order.orderStatus.replace(/_/g, ' ')}
                                                        </span>
                                                        <div style={{ fontSize: '10px', color: '#95a5a6', marginTop: '4px', fontWeight: 'bold' }}>
                                                            Received: {order.acceptedAt || order.assignedAt
                                                                ? new Date(order.acceptedAt || order.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                : new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={css.locationInfo}>
                                                    <div className={css.locItem}>
                                                        <div className={css.locIcon}>🏪</div>
                                                        <div className={css.locDetails}>
                                                            <strong>{order.restaurantName}</strong>
                                                            <p>{order.restaurantAddress}</p>
                                                            <a href={`tel:0000000000`} className={css.callLink}>📞 Call Restaurant</a>
                                                        </div>
                                                    </div>
                                                    <div className={css.routeLine}></div>
                                                    <div className={css.locItem}>
                                                        <div className={css.locIcon}>📍</div>
                                                        <div className={css.locDetails}>
                                                            <strong>{order.userDetails?.name}</strong>
                                                            <p>{order.userDetails?.address}</p>
                                                            <div className={css.contactRow}>
                                                                <a href={`tel:${order.userDetails?.phone}`} className={css.callLink}>📞 Call</a>
                                                                <button
                                                                    className={css.navLink}
                                                                    onClick={() => {
                                                                        const dest = order.customerLocation
                                                                            ? `${order.customerLocation.lat},${order.customerLocation.lng}`
                                                                            : encodeURIComponent(order.userDetails?.address);
                                                                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
                                                                    }}
                                                                >
                                                                    🗺️ Navigate
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={css.orderBrief}>
                                                    <div className={css.briefItem}>
                                                        <span>{order.paymentMethod === 'COD' ? '💰 COLLECT CASH:' : '✅ Status:'}</span>
                                                        <strong className={order.paymentMethod === 'COD' ? css.cod : ''}>
                                                            {order.paymentMethod === 'COD' ? `₹${order.totalAmount}` : `PAID (${order.paymentMethod})`}
                                                        </strong>
                                                    </div>
                                                    <div className={css.briefItem}>
                                                        <span>Distance:</span>
                                                        <strong>{order.deliveryDistance?.toFixed(1)} KM</strong>
                                                    </div>
                                                </div>

                                                {order.order_notes && (
                                                    <div className={css.noteBox}>
                                                        📝 Note: "{order.order_notes}"
                                                    </div>
                                                )}

                                                <div className={css.itemsList}>
                                                    <strong>Order Content:</strong>
                                                    <ul>
                                                        {order.items.map((it, idx) => (
                                                            <li key={idx}>{it.quantity}x {it.name}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className={css.actionArea}>
                                                    {(() => {
                                                        const config = getStepConfig(order.orderStatus);
                                                        if (config) {
                                                            return (
                                                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>
                                                                        Step {config.step} of {config.total}: {config.description}
                                                                    </div>
                                                                    <button
                                                                        className={css.primaryBtn}
                                                                        onClick={() => updateStatus(order._id, order.orderStatus)}
                                                                        disabled={actionLoading === order._id}
                                                                        style={{
                                                                            opacity: actionLoading === order._id ? 0.7 : 1,
                                                                            backgroundColor: config.step === 3 ? 'var(--green, #28a745)' :
                                                                                config.step === 2 ? 'var(--orange, #fd7e14)' :
                                                                                    'var(--blue, #007bff)'
                                                                        }}
                                                                    >
                                                                        {actionLoading === order._id ? 'Processing...' : `[ ${config.label} ]`}
                                                                    </button>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}

                                                    <button
                                                        className={css.chatToggle}
                                                        onClick={() => setActiveChatId(activeChatId === order._id ? null : order._id)}
                                                    >
                                                        {activeChatId === order._id ? 'Close Support Chat' : (
                                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                Customer Chat
                                                                {(() => {
                                                                    const count = (order.messages || []).filter(m => m.sender !== 'delivery').length;
                                                                    // Simple count of all incoming messages or sequential unread? 
                                                                    // Lets do sequential like Admin
                                                                    let seqCount = 0;
                                                                    const msgs = order.messages || [];
                                                                    for (let i = msgs.length - 1; i >= 0; i--) {
                                                                        if (msgs[i].sender !== 'delivery') seqCount++;
                                                                        else break;
                                                                    }
                                                                    return seqCount > 0 ? (
                                                                        <span style={{
                                                                            marginLeft: '8px',
                                                                            background: '#ff4757',
                                                                            color: 'white',
                                                                            borderRadius: '50%',
                                                                            width: '20px',
                                                                            height: '20px',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 'bold'
                                                                        }}>{seqCount}</span>
                                                                    ) : null;
                                                                })()}
                                                            </span>
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Chat is handled by global overlay */}
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}
                        </motion.section>
                    )}

                    {activeTab === 'history' && (
                        <motion.section
                            key="history"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <h2 className={css.sectionTitle}>Work Journal</h2>
                            <div className={css.historyList}>
                                {orders.history.length === 0 ? (
                                    <div className={css.emptyHistory}>
                                        <p>You haven't completed any orders yet.</p>
                                    </div>
                                ) : (
                                    orders.history.map(order => (
                                        <div key={order._id} className={css.historyItem}>
                                            <div className={css.histTop}>
                                                <span className={css.id}>#{order._id.slice(-6).toUpperCase()}</span>
                                                <span className={css.totalEarning}>+₹{order.deliveryCharge || 30}</span>
                                            </div>
                                            <div className={css.histMid}>
                                                <div className={css.routeText}>
                                                    <strong>{order.restaurantName}</strong>
                                                    <span>→</span>
                                                    <strong>{order.userDetails?.name}</strong>
                                                </div>
                                                <div className={css.orderValue}>Bill: ₹{order.totalAmount} ({order.paymentMode})</div>
                                            </div>

                                            <div className={css.histTimeline}>
                                                <div className={css.timePoint}>
                                                    <span className={css.timeLabel}>Got Order:</span>
                                                    <span className={css.timeValue}>
                                                        {new Date(order.acceptedAt || order.assignedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className={css.timePoint}>
                                                    <span className={css.timeLabel}>Delivered:</span>
                                                    <span className={css.timeValue}>
                                                        {order.deliveredAt
                                                            ? new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : (order.orderStatus === 'DELIVERED'
                                                                ? new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                : '—')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={css.histDate}>
                                                {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.section>
                    )}

                    {activeTab === 'profile' && (
                        <motion.section
                            key="profile"
                            className={css.profilePage}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div className={css.profileHeader}>
                                <div className={css.largeAvatarContainer}>
                                    <div className={css.largeAvatar}>
                                        {user?.profilePic ? (
                                            <img src={user.profilePic} alt="Profile" className={css.riderProfileImg} />
                                        ) : (
                                            user?.name?.charAt(0)
                                        )}
                                    </div>
                                    <label className={css.riderUploadBtn}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                const formData = new FormData();
                                                formData.append('profilePic', file);
                                                try {
                                                    const res = await fetch('/api/user/upload-profile-pic', {
                                                        method: 'POST',
                                                        headers: { 'Authorization': `Bearer ${localStorage.getItem('deliveryToken')}` },
                                                        body: formData
                                                    });
                                                    const data = await res.json();
                                                    if (res.ok) {
                                                        const updatedUser = { ...user, profilePic: data.profilePic };
                                                        localStorage.setItem('deliveryUser', JSON.stringify(updatedUser));
                                                        window.location.reload();
                                                    } else {
                                                        alert(data.msg || 'Upload failed');
                                                    }
                                                } catch (err) {
                                                    alert('Error uploading image');
                                                }
                                            }}
                                            hidden
                                        />
                                        📷
                                    </label>
                                </div>
                                <h3>{user?.name}</h3>
                                <p>{user?.mobile}</p>
                                <p>{user?.mobile}</p>
                                <div className={css.onlineBadge}>
                                    <span style={{ color: '#00e676' }}>●</span> Online & GPS Active
                                </div>
                            </div>

                            <div className={css.earningsCard}>
                                <label>Net Earnings</label>
                                <h2>₹{calculateEarnings()}</h2>
                                <p>From {orders.history.filter(o => o.status === 'DELIVERED').length} successful deliveries</p>
                                <button className={css.payoutBtn}>Request Payout</button>
                            </div>

                            <ul className={css.profileMenu}>
                                <li>
                                    <div className={css.menuLabel}>
                                        <span className={css.menuIcon}>🛡️</span>
                                        <span>Account Status</span>
                                    </div>
                                    <strong className={css.activeStatus}>Verified Partner</strong>
                                </li>
                                <li>
                                    <div className={css.menuLabel}>
                                        <span className={css.menuIcon}>📍</span>
                                        <span>Primary Zone</span>
                                    </div>
                                    <strong>Mahalingapura</strong>
                                </li>
                                <li>
                                    <div className={css.menuLabel}>
                                        <span className={css.menuIcon}>⭐</span>
                                        <span>Rating</span>
                                    </div>
                                    <strong>4.9 / 5.0</strong>
                                </li>
                                <li onClick={handleLogout} className={css.logoutItem}>
                                    <span className={css.menuIcon}>🚪</span>
                                    Logout from Portal
                                </li>
                            </ul>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* COD Payment Finalization Modal */}
                <AnimatePresence>
                    {finalizingOrder && (
                        <motion.div
                            className={css.paymentModalOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className={css.paymentModal}
                                initial={{ y: 50, scale: 0.9 }}
                                animate={{ y: 0, scale: 1 }}
                                exit={{ y: 50, scale: 0.9 }}
                            >
                                <div className={css.modalHeader}>
                                    <h3>Finalize Payment</h3>
                                    <button onClick={() => setFinalizingOrder(null)}>✕</button>
                                </div>
                                <div className={css.modalBody}>
                                    <div className={css.amountBanner}>
                                        <p>Collect Amount from Customer</p>
                                        <h2>₹{finalizingOrder.totalAmount}</h2>
                                    </div>

                                    <div className={css.paymentChoices}>
                                        <button
                                            className={`${css.choiceBtn} ${paymentOption === 'CASH' ? css.selected : ''}`}
                                            onClick={() => setPaymentOption('CASH')}
                                        >
                                            <span className={css.choiceIcon}>💵</span>
                                            <span className={css.choiceLabel}>Collected Cash</span>
                                        </button>
                                        <button
                                            className={`${css.choiceBtn} ${paymentOption === 'UPI' ? css.selected : ''}`}
                                            onClick={() => setPaymentOption('UPI')}
                                        >
                                            <span className={css.choiceIcon}>📱</span>
                                            <span className={css.choiceLabel}>Paid via UPI</span>
                                        </button>
                                    </div>

                                    {paymentOption === 'UPI' && (
                                        <motion.div
                                            className={css.qrSection}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                        >
                                            <p>Scan & Show this QR to Customer</p>
                                            {paymentSettings?.qrImageUrl ? (
                                                <img src={paymentSettings.qrImageUrl} alt="UPI QR" className={css.finalQr} />
                                            ) : (
                                                <div className={css.qrPlaceholder}>QR Code Loading...</div>
                                            )}
                                            <div className={css.upiIdText}>UPI ID: {paymentSettings?.upiId || 'N/A'}</div>
                                        </motion.div>
                                    )}

                                    <button
                                        className={css.finalizeBtn}
                                        onClick={() => updateStatus(finalizingOrder._id, finalizingOrder.status, true)}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Finalizing...' : `Confirm & Mark Delivered`}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <nav className={css.bottomNav}>
                <button
                    className={activeTab === 'active' ? css.navActive : ''}
                    onClick={() => setActiveTab('active')}
                >
                    <div className={css.iconWrapper}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {orders.active.length > 0 && <span className={css.notifDot}></span>}
                    </div>
                    <span>Tasks</span>
                    {activeTab === 'active' && <motion.div layoutId="navIndicator" className={css.navIndicator} />}
                </button>
                <button
                    className={activeTab === 'history' ? css.navActive : ''}
                    onClick={() => setActiveTab('history')}
                >
                    <div className={css.iconWrapper}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M3.05005 11C3.05005 6.05719 7.05719 2.05005 12 2.05005C16.9428 2.05005 20.95 6.05719 20.95 11C20.95 15.9428 16.9428 19.95 12 19.95C7.05719 19.95 3.05005 15.9428 3.05005 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 19.95V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span>Orders</span>
                    {activeTab === 'history' && <motion.div layoutId="navIndicator" className={css.navIndicator} />}
                </button>
                <button
                    className={activeTab === 'profile' ? css.navActive : ''}
                    onClick={() => setActiveTab('profile')}
                >
                    <div className={css.iconWrapper}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span>Account</span>
                    {activeTab === 'profile' && <motion.div layoutId="navIndicator" className={css.navIndicator} />}
                </button>
            </nav>

            {/* Premium Fullscreen Chat Overlay - Matches User Tracking Logic */}
            <AnimatePresence>
                {activeChatId && (
                    <motion.div
                        className={css.fullscreenChatOverlay}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        <Chat
                            orderId={activeChatId}
                            userRole="delivery"
                            userName={user?.name || user?.fullName || 'Rider'}
                            userImage={user?.profilePic}
                            onClose={() => setActiveChatId(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            {/* FIX 1: Assignment Popup Modal */}
            <AnimatePresence>
                {assignmentOrder && (
                    <motion.div
                        className={css.paymentModalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className={css.paymentModal}
                            initial={{ y: 50, scale: 0.9 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 50, scale: 0.9 }}
                        >
                            <div className={css.modalHeader}>
                                <h3>🚨 New Assignment!</h3>
                                <button onClick={() => setAssignmentOrder(null)}>✕</button>
                            </div>
                            <div className={css.modalBody}>
                                <div className={css.amountBanner} style={{ background: 'var(--blue)' }}>
                                    <p>New Order Available</p>
                                    <h2>#{assignmentOrder._id.slice(-6).toUpperCase()}</h2>
                                </div>
                                <div style={{ margin: '1rem 0', textAlign: 'center' }}>
                                    <p><strong>{assignmentOrder.restaurantName}</strong></p>
                                    <p>{assignmentOrder.restaurantAddress}</p>
                                    <p style={{ marginTop: '10px', color: 'var(--green)', fontWeight: 'bold' }}>
                                        Earn: ₹{assignmentOrder.deliveryCharge || 40}
                                    </p>
                                </div>
                                <button
                                    className={css.finalizeBtn}
                                    onClick={() => {
                                        setAssignmentOrder(null);
                                        setActiveTab('active');
                                        fetchOrders();
                                    }}
                                >
                                    View Task Details
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeliveryDashboard;
