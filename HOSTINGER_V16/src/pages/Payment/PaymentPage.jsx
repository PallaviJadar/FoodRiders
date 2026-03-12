import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import NavigationBar from '../../components/Navbars/NavigationBar.jsx';
import MobileNavbar from '../../components/Navbars/MobileNavbar.jsx';
import css from './PaymentPage.module.css';

const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const { orderId, totalAmount } = location.state || {};
    const [toggleMenu, setToggleMenu] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [settings, setSettings] = useState(null);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [fetchedTotal, setFetchedTotal] = useState(null);
    const [loadingOrder, setLoadingOrder] = useState(true);
    const [screenshotFile, setScreenshotFile] = useState(null);
    const [screenshotPreview, setScreenshotPreview] = useState(null);
    const [paymentSubmitted, setPaymentSubmitted] = useState(false);
    const [showBackWarning, setShowBackWarning] = useState(false);
    const [orderCreatedAt, setOrderCreatedAt] = useState(null);
    const [timeLeft, setTimeLeft] = useState("");
    const [isExpired, setIsExpired] = useState(false);
    const [showPayGuide, setShowPayGuide] = useState(true);

    // ========================================================
    // BACK NAVIGATION PROTECTION
    // Prevents user from accidentally leaving payment page
    // ========================================================
    useEffect(() => {
        if (!orderId || paymentSubmitted) return;

        // Browser back/forward button protection
        const handlePopState = (e) => {
            e.preventDefault();
            // Push state again to stay on page
            window.history.pushState(null, '', window.location.href);
            setShowBackWarning(true);
        };

        // Push an extra history entry so back button triggers popstate
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        // Tab close / refresh protection
        const handleBeforeUnload = (e) => {
            if (!paymentSubmitted) {
                e.preventDefault();
                e.returnValue = 'Payment is pending. Are you sure you want to leave?';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [orderId, paymentSubmitted]);

    // ========================================================
    // FETCH ORDER & SETTINGS
    // ========================================================
    useEffect(() => {
        if (!orderId) {
            navigate('/');
            return;
        }

        // Fetch definitive order amount from server
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}`);
                if (res.ok) {
                    const data = await res.json();
                    setFetchedTotal(data.totalAmount);
                    setOrderCreatedAt(data.createdAt);
                    // If user already submitted payment for this order, skip to tracking
                    if (data.paymentStatus === 'USER_MARKED_PAID' || data.paymentStatus === 'ADMIN_CONFIRMED') {
                        setPaymentSubmitted(true);
                        navigate(`/order-tracking/${orderId}`, { replace: true });
                        return;
                    }
                }
            } catch (err) {
                console.error("Order fetch failed:", err);
            } finally {
                setLoadingOrder(false);
            }
        };

        // Fetch Payment Settings with Timeout
        const fetchSettings = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

                const res = await fetch('/api/payment-settings', { signal: controller.signal, headers: { 'Cache-Control': 'no-cache' } });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                } else {
                    throw new Error("API Route Missing (Restart Server?)");
                }
            } catch (err) {
                console.warn("Using default payment settings. Error:", err);
                // Fallback to defaults
                setSettings({
                    upiId: 'foodriders@ybl',
                    upiName: 'FoodRiders',
                    qrImageUrl: '/images/QR.jpg.jpeg',
                    isUpiEnabled: true
                });
            } finally {
                setLoadingSettings(false);
            }
        };

        fetchOrder();
        fetchSettings();
    }, [orderId, navigate]);

    // ========================================================
    // COUNTDOWN TIMER LOGIC
    // ========================================================
    useEffect(() => {
        if (!orderCreatedAt) return;

        const timer = setInterval(() => {
            const created = new Date(orderCreatedAt).getTime();
            const now = new Date().getTime();
            const diff = 15 * 60 * 1000 - (now - created);

            if (diff <= 0) {
                setTimeLeft("Expired");
                setIsExpired(true);
                clearInterval(timer);
            } else {
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [orderCreatedAt]);

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

    const handlePaid = async () => {
        if (!screenshotFile) {
            alert("Please upload a payment screenshot first.");
            return;
        }
        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('paymentScreenshot', screenshotFile);

            const res = await fetch(`/api/orders/${orderId}/mark-paid`, {
                method: 'PUT',
                body: formData
            });

            if (res.ok) {
                setPaymentSubmitted(true); // Disable back protection
                clearCart();
                // Use replace to prevent going back to payment page
                navigate(`/order-tracking/${orderId}`, { replace: true });
            } else {
                alert("Failed to update status. Please try again.");
            }
        } catch (err) {
            alert("Connection error. Please retry.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeepLink = () => {
        if (!settings) return;
        const upiId = settings.upiId || 'foodriders@ybl';
        const name = settings.upiName || 'FoodRiders';
        const finalAmount = fetchedTotal !== null ? fetchedTotal : totalAmount;

        // UPI Deep Link Format
        const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${finalAmount}&cu=INR&tn=Order%20${orderId.slice(-6)}`;
        window.location.href = upiUrl;
    };

    // Handle the "Go back anyway" from our warning modal
    const handleForceBack = () => {
        setShowBackWarning(false);
        setPaymentSubmitted(true); // disable popstate listener
        navigate(`/order-tracking/${orderId}`, { replace: true });
    };

    const handleDownloadQR = async (e) => {
        if (e) e.preventDefault();
        const url = settings?.qrImageUrl || '/images/QR.jpg.jpeg';
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `FoodRiders_QR_${orderId.slice(-6).toUpperCase()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Download failed:", err);
            // Fallback: Open in new tab
            window.open(url, '_blank');
        }
    };

    if (!toggleMenu) {
        return <MobileNavbar setToggleMenu={setToggleMenu} toogleMenu={toggleMenu} />;
    }

    if (loadingSettings || loadingOrder) {
        return <div className={css.container}><div style={{ padding: '2rem', textAlign: 'center' }}>Loading payment details...</div></div>;
    }

    const currentTotal = fetchedTotal !== null ? fetchedTotal : totalAmount;

    const qrImage = settings?.qrImageUrl || '/images/QR.jpg.jpeg';
    const upiId = settings?.upiId || 'foodriders@ybl';
    const payeeName = settings?.upiName || 'FoodRiders';

    return (
        <div className={css.container}>
            <NavigationBar setToggleMenu={setToggleMenu} />
            <div className={css.content}>
                <div className={css.paymentCard}>
                    <div className={css.timerBadge}>
                        <span className={css.timerIcon}>⏰</span>
                        <span>Pay within: <strong>{timeLeft || "15:00"}</strong></span>
                    </div>

                    <div className={css.header}>
                        <h1>Scan & Pay</h1>
                        <p>Complete payment to confirm order</p>
                    </div>

                    <div className={css.amountSection}>
                        <span className={css.amountLabel}>Total Payable</span>
                        <span className={css.amountValue}>₹{currentTotal}</span>
                    </div>

                    <div className={css.actions} style={{ marginBottom: '1.5rem' }}>
                        <button className={css.primaryBtn} onClick={handleDeepLink}>
                            Open UPI App
                        </button>
                    </div>

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
                                        <img
                                            src={settings?.qrImageUrl || '/images/QR.jpg.jpeg'}
                                            onError={(e) => e.target.src = '/images/QR.jpg.jpeg'}
                                            alt="UPI QR"
                                            className={css.qrImg}
                                        />
                                        <button onClick={handleDownloadQR} className={css.downloadBtn}>
                                            📥 Download QR
                                        </button>
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
                                                <span>{settings?.upiId || 'foodriders@ybl'}</span>
                                                <button onClick={() => { navigator.clipboard.writeText(settings?.upiId || 'foodriders@ybl'); alert('Copied!'); }}>Copy</button>
                                            </div>
                                        </div>
                                        <div className={css.copyItem}>
                                            <label>Mobile Number</label>
                                            <div className={css.copyAction}>
                                                <span>{settings?.paymentPhone || '9876543210'}</span>
                                                <button onClick={() => { navigator.clipboard.writeText(settings?.paymentPhone || '9876543210'); alert('Copied!'); }}>Copy</button>
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

                    <div className={css.uniqueNote}>
                        <div className={css.noteIcon}>📢</div>
                        <div className={css.noteBody}>
                            <strong>Important Note:</strong>
                            <p>Your order will be started ONLY after we verify your payment screenshot. Please ensure the transaction ID is visible.</p>
                        </div>
                    </div>

                    <div className={css.uploadSection}>
                        <div className={css.screenshotHeader} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '1.5rem' }}>📸</span>
                            <h4 className={css.uploadTitle} style={{ margin: 0 }}>Upload Payment Proof</h4>
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
                    </div>

                    <div className={css.actions}>
                        <button
                            className={css.secondaryBtn}
                            onClick={handlePaid}
                            disabled={isProcessing || !screenshotFile || isExpired}
                            style={{ backgroundColor: (screenshotFile && !isExpired) ? '#2ecc71' : '#ccc', color: 'white', border: 'none' }}
                        >
                            {isProcessing ? 'Verifying...' : isExpired ? '❌ Payment Time Expired' : '✅ I Have Paid — Submit Proof'}
                        </button>
                        <p className={css.footerNote}>
                            {isExpired ? 'Please go back and place a new order.' : 'Order will be cancelled if payment is not verified within 15 mins.'}
                        </p>
                    </div>

                    <div className={css.trustBadge}>
                        <img src="/images/security.png" alt="Secure" onError={(e) => e.target.style.display = 'none'} />
                        <span>100% Safe & Secure Payment</span>
                    </div>
                </div>
            </div>

            {/* FLOATING WHATSAPP HELP */}
            {settings?.notificationAlerts?.adminPhone && (
                <a
                    href={`https://wa.me/${settings.notificationAlerts.adminPhone.replace(/\D/g, '')}?text=Hi, I need help with my payment for Order ID: ${orderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={css.whatsappHelp}
                >
                    <div className={css.whatsappIcon}>💬</div>
                    <span>Need Help?</span>
                </a>
            )}

            {/* BACK WARNING MODAL */}
            {showBackWarning && (
                <div className={css.backWarningOverlay}>
                    <div className={css.backWarningModal}>
                        <div className={css.backWarningIcon}>⚠️</div>
                        <h3>Complete Your Payment</h3>
                        <p>Your order is created. Please complete payment & upload proof to avoid order cancellation.</p>
                        <div className={css.backWarningActions}>
                            <button className={css.backWarningStay} onClick={() => setShowBackWarning(false)}>
                                Stay & Pay
                            </button>
                            <button className={css.backWarningLeave} onClick={handleForceBack}>
                                Leave Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentPage;
