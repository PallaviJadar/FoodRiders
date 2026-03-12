import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCart } from '../context/CartContext';
import css from './OrderTracking.module.css';
import NavigationBar from '../components/Navbars/NavigationBar.jsx';
import MobileNavbar from '../components/Navbars/MobileNavbar.jsx';

import socket from '../utils/socket';
import Chat from '../components/Chat.jsx';
import FloatingChatWidget from '../components/FloatingChatWidget.jsx';
import { useAuth } from '../context/AuthContext';
import { useUserOrderNotifications } from '../hooks/useNotificationSounds';
import OrderDelivered from './OrderDelivered';
import OrderCancelled from './OrderCancelled';

// Fix for default Leaflet markers in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Rider Icon
const riderIcon = new L.Icon({
    iconUrl: '/images/delivery-boy-1.png',
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25],
    className: css.riderMarker
});

const homeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/619/619153.png', // Modern home icon
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

const shopIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046747.png', // Restaurant icon
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

// Component to handle map movement
const MapUpdater = ({ center, zoom, follow }) => {
    const map = useMap();
    const lastCenter = useRef(null);

    useEffect(() => {
        if (!follow) return;

        // Prevent micro-jitters and aggressive re-centering
        const shouldMove = !lastCenter.current ||
            Math.abs(center[0] - lastCenter.current[0]) > 0.0001 ||
            Math.abs(center[1] - lastCenter.current[1]) > 0.0001;

        if (shouldMove) {
            map.flyTo(center, zoom, { animate: true, duration: 1.5 });
            lastCenter.current = center;
        }
    }, [center, zoom, map, follow]);
    return null;
};

const OrderTracking = () => {
    const location = useLocation();
    const { orderId: urlOrderId } = useParams(); // Get from URL
    const { user } = useAuth();
    const { clearCart } = useCart();
    const orderId = urlOrderId || location.state?.orderId; // Prefer URL param
    const [toggleMenu, setToggleMenu] = useState(true);

    const [orderData, setOrderData] = useState(null);
    const [markingPaid, setMarkingPaid] = useState(false);

    // UseRef for persistent data access in closures
    const orderDataRef = useRef(orderData);
    useEffect(() => { orderDataRef.current = orderData; }, [orderData]);

    // Timeline mapping (Step 7 - No Hardcoding)
    const steps = [
        { id: "ACCEPTED", label: "Order Accepted" },
        { id: "PREPARING", label: "Preparing Food" },
        { id: "READY_FOR_PICKUP", label: "Food is Ready" },
        { id: "ASSIGNED", label: "Partner Assigned" },
        { id: "PICKED_UP", label: "Order Picked Up" },
        { id: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
        { id: "DELIVERED", label: "Delivered" }
    ];

    const [status, setStatus] = useState(0);
    const [previousStatus, setPreviousStatus] = useState(null);

    // Audio Notifications
    const { playUserNotification } = useUserOrderNotifications(orderData?.status, previousStatus);

    // Locations & State
    const [userLocation, setUserLocation] = useState([12.9107, 77.5540]); // Bangalore default
    const [shopLocation, setShopLocation] = useState([12.9180, 77.5600]); // Bangalore default
    const [riderPosition, setRiderPosition] = useState(shopLocation);
    const [route, setRoute] = useState([]);
    const [eta, setEta] = useState(null);
    const [lastKnownRiderPos, setLastKnownRiderPos] = useState(null);
    const [showDriverCard, setShowDriverCard] = useState(true);

    // Force scroll to top on load
    useEffect(() => {
        const resetScroll = () => {
            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        };

        resetScroll();
        // Aggressive retry to beat browser scroll restoration
        const t1 = setTimeout(resetScroll, 100);
        const t2 = setTimeout(resetScroll, 300);

        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    // Clear cart once order is successfully tracked
    useEffect(() => {
        if (orderId) {
            clearCart();
        }
    }, [orderId, clearCart]);

    // Get User Geolocation
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
                (err) => console.warn('User geolocation blocked:', err),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    // Update Browser Title
    useEffect(() => {
        if (!orderData?.status) return;

        switch (orderData.orderStatus) {
            case 'OUT_FOR_DELIVERY':
            case 'ON_THE_WAY':
                document.title = '🚴 Your Order is on the way!';
                break;
            case 'DELIVERED':
                document.title = '✅ Order Delivered | FoodRiders';
                break;
            case 'PAYMENT_CONFIRMED':
                document.title = '🍳 Preparing your food...';
                break;
            case 'PICKED_UP':
                document.title = '📦 Order Picked Up';
                break;
            default:
                document.title = 'FoodRiders - Track Order';
        }
    }, [orderData?.status]);

    const fetchOSRMRouting = async (start, end) => {
        try {
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
            const data = await res.json();
            if (data.routes && data.routes[0]) {
                const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                setRoute(coords);

                // Only set OSRM-based ETA when rider is actually in transit
                // Otherwise the shop→customer distance gives a misleadingly short time
                const currentStatus = orderDataRef.current?.status;
                const riderInTransit = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'ON_THE_WAY', 'ARRIVING'].includes(currentStatus);
                if (riderInTransit) {
                    const distance = data.routes[0].distance;
                    const timeInMinutes = Math.round(distance / (8.3 * 60)) + 2;
                    setEta(timeInMinutes);
                } else {
                    // Clear any stale OSRM eta so the status-based fallback is used
                    setEta(null);
                }
            }
        } catch (err) { }
    };

    useEffect(() => {
        // Fallback: If no orderId in URL/State, try to find the active order for the user
        if (!orderId && user) {
            const findActiveOrder = async () => {
                try {
                    const res = await fetch(`/api/orders/user/${user.id || user._id}`);
                    const data = await res.json();
                    const orders = Array.isArray(data) ? data : (data.orders || []);
                    const active = orders.find(o => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.status));
                    if (active) {
                        window.history.replaceState(null, '', `/order-tracking/${active._id}`);
                        setOrderData(active);
                        // Trigger a re-run of the main tracking effect by setting location.state or similar?
                        // Actually, just calling processOrderData(active) within the main effect scope is better.
                        // For now, let's just make sure the user is redirected or the ID is filled.
                    }
                } catch (err) { }
            };
            findActiveOrder();
        }

        if (!orderId) return;

        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}?_t=${Date.now()}`);
                const data = await res.json();
                if (data) {
                    processOrderData(data);
                }
            } catch (err) { }
        };

        const processOrderData = (data) => {
            setOrderData(prev => {
                if (prev?.status !== data.status) {
                    setPreviousStatus(prev?.status || null);
                }
                return data;
            });

            let stageIndex = steps.findIndex(s => s.id === (data.orderStatus || data.status));
            // If status is not found (e.g. PENDING_ACCEPTANCE), it's before ACCEPTED
            if (stageIndex === -1) stageIndex = -1;

            setStatus(stageIndex);

            let sLoc = shopLocation;
            if (data.shopLocation?.lat && data.shopLocation?.lng) {
                sLoc = [data.shopLocation.lat, data.shopLocation.lng];
                setShopLocation(sLoc);
            }

            let cLoc = userLocation;
            if (data.customerLocation?.lat && data.customerLocation?.lng) {
                cLoc = [data.customerLocation.lat, data.customerLocation.lng];
                setUserLocation(cLoc);
            }

            // Always try to show a route if we have shop and user location
            const startPos = (data.riderLocation?.lat && data.riderLocation?.lng)
                ? [data.riderLocation.lat, data.riderLocation.lng]
                : sLoc;

            setLastKnownRiderPos(startPos);
            fetchOSRMRouting(startPos, cLoc);
        };

        fetchStatus();

        // Socket.io Real-time connection
        const handleJoin = () => {
            if (user) socket.emit('joinUser', user.id || user._id);
            socket.emit('join', orderId);
        };

        if (socket.connected) handleJoin();
        socket.on('connect', handleJoin);

        // ✅ Centralized Listener (Step 4)
        socket.on('orderUpdated', (updatedOrder) => {
            if (updatedOrder._id === orderId) {
                console.log('🔄 Order updated via socket:', updatedOrder.orderStatus);
                processOrderData(updatedOrder);
            }
        });

        // Compatibility listeners
        socket.on('orderUpdate', (data) => {
            if (data._id === orderId) processOrderData(data);
        });
        socket.on('orderStatusUpdate', (data) => {
            if (data._id === orderId) processOrderData(data);
        });

        socket.on('locationUpdate', (newLocation) => {
            const newPos = [newLocation.lat, newLocation.lng];
            setLastKnownRiderPos(newPos);

            const dest = [
                orderDataRef.current?.customerLocation?.lat || userLocation[0],
                orderDataRef.current?.customerLocation?.lng || userLocation[1]
            ];
            fetchOSRMRouting(newPos, dest);
        });

        const interval = setInterval(fetchStatus, 15000);

        const moveInterval = setInterval(() => {
            if (!lastKnownRiderPos) return;
            setRiderPosition(prev => {
                const delta = 0.05;
                const latDiff = (lastKnownRiderPos[0] - prev[0]) * delta;
                const lngDiff = (lastKnownRiderPos[1] - prev[1]) * delta;

                if (Math.abs(latDiff) < 0.000001 && Math.abs(lngDiff) < 0.000001) return lastKnownRiderPos;
                return [prev[0] + latDiff, prev[1] + lngDiff];
            });
        }, 50);

        return () => {
            socket.off('orderUpdated');
            socket.off('orderUpdate');
            socket.off('orderStatusUpdate');
            socket.off('locationUpdate');
            socket.emit('leave', orderId);
            clearInterval(interval);
            clearInterval(moveInterval);
        };
    }, [orderId, lastKnownRiderPos, userLocation]);

    const [screenshotFile, setScreenshotFile] = useState(null);
    const [screenshotPreview, setScreenshotPreview] = useState(null);

    const handleScreenshotSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('Image too large. Max 5MB allowed.');
            return;
        }
        setScreenshotFile(file);
        setScreenshotPreview(URL.createObjectURL(file));
    };

    const handleMarkAsPaid = async () => {
        if (!screenshotFile) {
            alert('Please upload a payment screenshot first.');
            return;
        }
        setMarkingPaid(true);
        try {
            const formData = new FormData();
            formData.append('paymentScreenshot', screenshotFile);

            const res = await fetch(`/api/orders/${orderId}/mark-paid`, {
                method: 'PUT',
                body: formData
            });
            if (res.ok) {
                // Status will be updated via socket
            }
        } catch (err) {
            console.error('Failed to mark paid:', err);
        } finally {
            setMarkingPaid(false);
        }
    };

    const [systemSettings, setSystemSettings] = useState(null);
    const [showPayGuide, setShowPayGuide] = useState(true);

    useEffect(() => {
        fetch('/api/payment-settings')
            .then(res => res.json())
            .then(data => setSystemSettings(data))
            .catch(err => console.error('Settings fetch error:', err));
    }, []);


    if (!toggleMenu) {
        return <MobileNavbar setToggleMenu={setToggleMenu} toogleMenu={toggleMenu} />
    }

    // ✅ SHOW DELIVERY SUCCESS PAGE WHEN ORDER IS DELIVERED (Index 6)
    if (status === 6) {
        return <OrderDelivered />;
    }

    // ✅ SHOW CANCELLED PAGE
    if (orderData?.status === 'CANCELLED') {
        return <OrderCancelled orderData={orderData} />;
    }

    // ✅ SHOW PAYMENT VERIFICATION PENDING PAGE
    if (orderData?.paymentMode === 'UPI_MANUAL' &&
        orderData?.paymentStatus === 'USER_MARKED_PAID' &&
        status === 0) {
        return <PaymentVerificationPending orderId={orderId} screenshotUrl={orderData?.paymentScreenshot} />;
    }

    return (
        <div className={css.container}>
            <NavigationBar setToggleMenu={setToggleMenu} />

            <div className={css.mapArea}>
                <MapContainer
                    key={orderId}
                    center={riderPosition}
                    zoom={15}
                    className={css.leafletMap}
                    scrollWheelZoom={false}
                    dragging={true}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png"
                    />
                    <MapUpdater center={riderPosition} zoom={16} follow={orderData?.status === 'ON_THE_WAY' || orderData?.status === 'OUT_FOR_DELIVERY'} />

                    {/* Routing Polyline - Premium Styled */}
                    {route.length > 0 && (
                        <>
                            <Polyline positions={[riderPosition, ...route]} color="#ff4757" weight={8} opacity={0.2} />
                            <Polyline positions={[riderPosition, ...route]} color="#ff4757" weight={3} opacity={0.8} dashArray="10, 10" className={css.routePulse} />
                        </>
                    )}

                    {/* Shop Location */}
                    <Marker position={shopLocation} icon={shopIcon}>
                        <Popup><b>Restaurant</b><br />Preparing your order</Popup>
                    </Marker>

                    {/* User Home Marker */}
                    <Marker position={userLocation} icon={homeIcon}>
                        <Popup>
                            <b>Your Home</b><br />
                            {orderData?.userDetails?.address || 'Delivery Address'}
                        </Popup>
                    </Marker>

                    {/* Rider Marker with Pulsing Ring */}
                    <div className={css.riderMarkerContainer}>
                        <Marker position={riderPosition} icon={riderIcon}>
                            <Popup>
                                <b>FoodRiders Delivery</b><br />
                                {orderData?.deliveryBoyId?.fullName || 'Our Partner'} is on the way!
                            </Popup>
                        </Marker>
                    </div>
                </MapContainer>

                {/* NEW FLOATING UI ELEMENTS */}
                <LiveActivity
                    status={status}
                    orderData={orderData}
                    eta={eta}
                    playUserNotification={playUserNotification}
                />

                {/* DriverCard merged into ChatWidget */}

            </div>

            <div className={css.trackingPanel}>
                <div className={css.handleBar}></div>

                {/* Manual UPI Actions Removed */}
                {false && (orderData?.paymentMode === 'UPI_MANUAL') && (orderData?.paymentStatus === 'PENDING' || orderData?.paymentStatus === 'FAILED') && (
                    <div className={css.manualPaySection}>
                        {/* 💡 How to Pay Toggle */}
                        <div className={css.guideToggle} onClick={() => setShowPayGuide(!showPayGuide)}>
                            <span className={css.guideIcon}>💡</span>
                            <span className={css.guideText}>How to complete payment?</span>
                            <span className={css.chevron}>{showPayGuide ? '▲' : '▼'}</span>
                        </div>

                        {showPayGuide && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className={css.paymentGuide}
                            >
                                <div className={css.paymentOptions}>
                                    <div className={css.paymentMethodCard}>
                                        <div className={css.methodHeader}>
                                            <span className={css.methodBadge}>Option 1</span>
                                            <h4>Scan QR Code</h4>
                                        </div>
                                        <div className={css.qrContainer}>
                                            <img src={systemSettings?.qrImageUrl || '/images/QR.jpg.jpeg'} alt="UPI QR" className={css.qrImg} />
                                            <a href={systemSettings?.qrImageUrl || '/images/QR.jpg.jpeg'} download="FoodRiders_QR.jpg" className={css.downloadBtn}>
                                                📥 Download QR
                                            </a>
                                        </div>
                                    </div>

                                    <div className={css.paymentMethodCard}>
                                        <div className={css.methodHeader}>
                                            <span className={css.methodBadge}>Option 2</span>
                                            <h4>UPI ID / Phone</h4>
                                        </div>
                                        <div className={css.copyGroup}>
                                            <div className={css.copyItem}>
                                                <label>UPI ID</label>
                                                <div className={css.copyAction}>
                                                    <span>{systemSettings?.upiId || 'foodriders@ybl'}</span>
                                                    <button onClick={() => { navigator.clipboard.writeText(systemSettings?.upiId || 'foodriders@ybl'); alert('Copied!'); }}>Copy</button>
                                                </div>
                                            </div>
                                            <div className={css.copyItem}>
                                                <label>Mobile Number</label>
                                                <div className={css.copyAction}>
                                                    <span>{systemSettings?.paymentPhone || '9876543210'}</span>
                                                    <button onClick={() => { navigator.clipboard.writeText(systemSettings?.paymentPhone || '9876543210'); alert('Copied!'); }}>Copy</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={css.visualSteps}>
                                    <div className={css.vStep}>
                                        <div className={css.vStepNum}>1</div>
                                        <p>Save QR or Copy UPI ID</p>
                                    </div>
                                    <div className={css.vStepArrow}>→</div>
                                    <div className={css.vStep}>
                                        <div className={css.vStepNum}>2</div>
                                        <p>Pay on PhonePe/GPay</p>
                                    </div>
                                    <div className={css.vStepArrow}>→</div>
                                    <div className={css.vStep}>
                                        <div className={css.vStepNum}>3</div>
                                        <p>Take Screenshot</p>
                                    </div>
                                    <div className={css.vStepArrow}>→</div>
                                    <div className={css.vStep}>
                                        <div className={css.vStepNum}>4</div>
                                        <p>Upload Below & Done</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div className={css.screenshotUploadCard}>
                            {orderData?.paymentStatus === 'FAILED' && (
                                <div className={css.reuploadWarning}>
                                    ⚠️ Payment Verification Failed: {orderData.rejectReason || 'Invalid proof'}. Please re-upload correct proof.
                                </div>
                            )}
                            <div className={css.screenshotHeader}>
                                <div className={css.screenshotIcon}>📸</div>
                                <div>
                                    <h4 className={css.screenshotTitle}>{orderData?.paymentStatus === 'FAILED' ? 'Re-upload Payment Proof' : 'Upload Payment Proof'}</h4>
                                    <p className={css.screenshotSubtitle}>Take a screenshot of your successful transaction and upload it below</p>
                                </div>
                            </div>

                            {screenshotPreview ? (
                                <div className={css.screenshotPreviewBox}>
                                    <img src={screenshotPreview} alt="Payment Screenshot" className={css.screenshotPreviewImg} />
                                    <button className={css.screenshotRemoveBtn} onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}>✕ Remove</button>
                                </div>
                            ) : (
                                <label className={css.screenshotDropZone}>
                                    <input type="file" accept="image/*" onChange={handleScreenshotSelect} hidden />
                                    <div className={css.dropZoneContent}>
                                        <span className={css.dropZoneIcon}>📤</span>
                                        <span className={css.dropZoneText}>Tap to upload screenshot</span>
                                        <span className={css.dropZoneHint}>JPG, PNG, WebP • Max 5MB</span>
                                    </div>
                                </label>
                            )}

                            <button
                                className={css.screenshotSubmitBtn}
                                onClick={handleMarkAsPaid}
                                disabled={markingPaid || !screenshotFile}
                            >
                                {markingPaid ? (
                                    <span>⏳ Uploading & Notifying...</span>
                                ) : (
                                    <span>✅ I've Paid — Submit Proof</span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {orderData?.paymentStatus === 'FAILED' && (
                    <div className={css.errorBox}>
                        ❌ Payment Verification Failed: {orderData.rejectReason || 'Invalid transaction'}
                    </div>
                )}

                {orderData?.scheduled_at && (
                    <div className={css.scheduledInfo}>
                        ⏰ Delivered on: {new Date(orderData.scheduled_at).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                    </div>
                )}

                {orderData?.order_notes && (
                    <div className={css.userNotes}>
                        📝 your Note: "{orderData.order_notes}"
                    </div>
                )}

                {/* USER CANCEL ACTION */}
                {['CREATED', 'PAYMENT_PENDING'].includes(orderData?.status) && (
                    <div className={css.cancelSection}>
                        <button
                            className={css.userCancelBtn}
                            onClick={async () => {
                                if (window.confirm('Do you really want to cancel this order?')) {
                                    try {
                                        const res = await fetch(`/api/orders/${orderId}/status`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'CANCELLED', reason: 'Order cancelled by you (Customer)' })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            alert('Order cancelled successfully.');
                                            window.location.reload();
                                        } else {
                                            alert(data.message || 'Failed to cancel order');
                                        }
                                    } catch (err) {
                                        alert('Error cancelling order');
                                    }
                                }
                            }}
                        >
                            Cancel My Order
                        </button>
                        <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '8px', textAlign: 'center' }}>
                            Cancellation is only allowed before restaurant confirmation.
                        </p>
                    </div>
                )}

                {/* Status Timeline - Simplified since we have the top card now, but keeping for detail */}
                <div className={css.timeline}>
                    {steps.map((step, index) => {
                        const isCompleted = index < status;
                        const isCurrent = index === status;

                        let subtext = '';
                        let displayCompleted = isCompleted;
                        let displayCurrent = isCurrent;
                        let label = step.label;

                        // Delivered Step (Index 6)
                        if (index === 6 && status === 6) {
                            displayCompleted = true;
                            displayCurrent = false;
                        }

                        return (
                            <div key={index} className={`${css.step} ${displayCompleted || displayCurrent ? css.activeStep : ''}`}>
                                <div className={`${css.stepIcon} ${displayCurrent ? css.currentPulse : ''} ${displayCompleted ? css.completedIcon : ''}`}>
                                    {displayCompleted ? (
                                        <motion.svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </motion.svg>
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>
                                <div className={css.stepContent}>
                                    <h4>{label}</h4>
                                    {displayCompleted && <span className={css.stepComplete}>Completed</span>}
                                    {subtext && <span className={css.stepSubtext}>{subtext}</span>}
                                    {displayCurrent && !subtext && <span className={css.stepCurrent}>In Progress</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <hr className={css.divider} />

                {/* Order Summary */}
                <div className={css.orderSummary}>
                    <h4>Your Order Items</h4>
                    <div className={css.itemListMini}>
                        {orderData?.items?.map((item, idx) => (
                            <div key={idx} className={css.itemMiniRow}>
                                <span>{item.quantity}x {item.name}</span>
                                <span>₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                        <div className={css.itemMiniRow}>
                            <span>Delivery Fee</span>
                            <span>{(Number(orderData?.deliveryFee) || 0) === 0 ? 'FREE' : `₹${Number(orderData?.deliveryFee) || 0}`}</span>
                        </div>
                        {orderData?.extraCharges?.map((charge, i) => (
                            <div key={i} className={css.itemMiniRow} style={{ color: '#ff4757', fontWeight: 600 }}>
                                <span>{charge.name}</span>
                                <span>+₹{Number(charge.amount) || 0}</span>
                            </div>
                        ))}
                        <div className={css.itemMiniRow}>
                            <span>Platform & Packaging</span>
                            <span>₹{(Number(orderData?.platformFee) || 0) + (Number(orderData?.packagingFee) || 0)}</span>
                        </div>
                    </div>
                    <div className={css.totalMiniRow}>
                        <span>Total Payable</span>
                        <span>₹{Number(orderData?.totalAmount) || 0}</span>
                    </div>
                </div>

                <hr className={css.divider} />

            </div>

            {/* Real-time Support Chat - Moved out of trackingPanel for better stacking/visibility */}
            {orderId && (
                <FloatingChatWidget
                    orderId={orderId}
                    userRole="user"
                    userName={user?.fullName || orderData?.userDetails?.name || 'Customer'}
                    userImage={user?.profilePic}
                    deliveryPartner={(status >= 2 && status < 5) ? orderData?.deliveryBoyId : null}
                />
            )}
        </div>
    );
};

// --- NEW UI COMPONENTS (MOVED OUTSIDE) ---
const LiveActivity = ({ status, orderData, eta, playUserNotification }) => {
    let progress = 10;
    if (status >= 3) progress = 50; // Assigned
    if (status >= 5) progress = 80; // Out for delivery
    if (status >= 6) progress = 100; // Delivered

    // Dynamic ETA Logic for Instant Updates
    const getEtaDisplay = () => {
        if (status >= 5) return 'Enjoy!';
        // Use Real-time OSRM ETA if available
        if (eta) return eta;

        // Smart Fallbacks based on Live Status to simulate progress
        switch (status) {
            case 0: return '40-50'; // Accepted
            case 1: return '30-45'; // Preparing
            case 2: return '25-30'; // Ready
            case 3: return '25-35'; // Partner Assigned 
            case 4: return '20-30'; // Picked Up
            case 5: return orderData.orderStatus === 'ARRIVING' ? '5-10' : '15-25'; // On the Way / Arriving
            default: return '40-45';
        }
    };

    const displayTime = getEtaDisplay();
    const isFinished = status >= 5;

    // Loading Skeleton to prevent layout jump
    if (!orderData) {
        return (
            <div className={css.liveActivityCard} style={{ justifyContent: 'center', alignItems: 'center', height: '140px' }}>
                <span style={{ color: '#999', fontSize: '0.9rem' }}>Connecting to live order...</span>
            </div>
        );
    }

    // Don't show if cancelled
    if (status < 0) return null;

    return (
        <div className={css.liveActivityCard}>
            <div className={css.liveHeader}>
                <div className={css.liveRestaurant}>
                    {/* Placeholder Rest Icon */}
                    <div style={{ width: '24px', height: '24px', background: '#ff4757', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px' }}>🍔</div>
                    <span className={css.liveRestName}>{orderData.restaurantName || 'FoodRiders Order'}</span>
                </div>
                <div className={css.liveAppLogo} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    FoodRiders
                </div>
            </div>

            <div className={css.liveTimeSection}>
                <div className={css.liveStatusText}>
                    {status === 6 ? 'Order Delivered' : 'Estimated Arrival'}
                </div>
                <div className={css.liveTimeBig}>
                    {displayTime} <span style={status >= 6 ? { display: 'none' } : {}}>mins</span>
                </div>
            </div>

            <div className={css.liveProgressContainer}>
                <div className={css.liveProgressBar}>
                    <div className={css.liveProgressFill} style={{ width: `${progress}%` }}></div>
                </div>
                <div className={css.liveIconsStrip}>
                    <div className={`${css.liveStepIcon} ${status >= 0 ? css.liveStepActive : ''}`}>🛍️</div>
                    <div className={`${css.liveStepIcon} ${status >= 3 ? css.liveStepActive : ''}`}>🛵</div>
                    <div className={`${css.liveStepIcon} ${status >= 5 ? css.liveStepActive : (orderData.orderStatus === 'ARRIVING' ? css.liveStepActive : '')}`}>🏠</div>
                </div>
            </div>
        </div>
    );
};

const PaymentVerificationPending = ({ orderId, screenshotUrl }) => {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', padding: '2rem', textAlign: 'center', background: '#f8f9fa'
        }}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ background: 'white', padding: '2rem', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%' }}
            >
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
                <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>Verifying Payment</h2>
                <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
                    We have received your payment proof. <br />
                    Please wait while the admin verifies your transaction.
                </p>
                <div style={{ margin: '20px 0', padding: '15px', background: '#ecf0f1', borderRadius: '10px', fontSize: '0.9rem' }}>
                    <strong>Order ID:</strong> #{orderId?.slice(-6).toUpperCase()}
                </div>

                {screenshotUrl && (
                    <div style={{ margin: '15px 0', borderRadius: '12px', overflow: 'hidden', border: '2px solid #2ecc71', position: 'relative' }}>
                        <div style={{ background: '#2ecc71', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            📸 Your Uploaded Proof
                        </div>
                        <img src={screenshotUrl} alt="Payment Proof" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', background: '#f8f9fa' }} />
                    </div>
                )}

                <div className={css.onTheWayPulse} style={{ display: 'inline-block', position: 'relative', marginTop: '10px' }}>
                    Verifying...
                </div>
                <p style={{ fontSize: '0.8rem', color: '#bdc3c7', marginTop: '20px' }}>
                    This usually takes 1-2 minutes.
                </p>
            </motion.div>
        </div>
    );
};

const DriverCard = ({ status, orderData, onClose }) => {
    const driver = orderData?.deliveryBoyId;
    // Show only if driver assigned (index 3) and order active
    if (!driver || typeof driver !== 'object' || status < 3 || status >= 6) return null;

    return (
        <div className={css.driverFloatingCard}>
            <button className={css.closeDriverBtn} onClick={onClose}>×</button>
            <div className={css.driverAvatarRing}>
                <img src={driver.image || '/images/default_user.png'} className={css.driverAvatarImg} onError={(e) => e.target.src = '/images/default_user.png'} />
            </div>
            <div className={css.driverCardDetails}>
                <div className={css.driverCardName}>{driver.fullName}</div>
                <div className={css.driverCardRole}>Your Delivery Partner</div>
            </div>
            <a href={`tel:${driver.mobile}`} className={css.driverCardCall}>📞</a>
        </div>
    );
};

export default OrderTracking;
