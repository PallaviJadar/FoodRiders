import React, { useState } from 'react';
import { motion } from 'framer-motion';
import css from './OrderCancelled.module.css';
import NavigationBar from '../components/Navbars/NavigationBar.jsx';
import MobileNavbar from '../components/Navbars/MobileNavbar.jsx';

const OrderCancelled = ({ orderData: initialOrderData }) => {
    const [toggleMenu, setToggleMenu] = useState(true);
    const [orderData, setOrderData] = useState(initialOrderData);

    // Re-fetch to ensure we have the very latest reason from DB
    React.useEffect(() => {
        const fetchLatest = async () => {
            try {
                const res = await fetch(`/api/orders/${initialOrderData?._id}`);
                const data = await res.json();
                if (data && data.rejectReason) {
                    setOrderData(data);
                }
            } catch (err) {
                console.error('Failed to fetch latest cancel reason:', err);
            }
        };
        if (initialOrderData?._id) fetchLatest();
    }, [initialOrderData?._id]);

    if (!toggleMenu) {
        return <MobileNavbar setToggleMenu={setToggleMenu} toogleMenu={toggleMenu} />
    }

    return (
        <div style={{ background: '#fff', minHeight: '100vh' }}>
            <NavigationBar setToggleMenu={setToggleMenu} />

            <div className={css.container}>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className={css.cancelIcon}
                >
                    🚫
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={css.title}
                >
                    Order Cancelled
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={css.reasonCard}
                >
                    <div className={css.reasonLabel}>Reason for Cancellation:</div>
                    <div className={css.reasonText}>
                        {orderData?.rejectReason || 'Order Cancelled'}
                    </div>
                </motion.div>

                {/* Refund Status Section */}
                {(orderData?.walletAmountUsed > 0 || (orderData?.paymentMode === 'UPI_MANUAL' && ['USER_MARKED_PAID', 'ADMIN_CONFIRMED'].includes(orderData?.paymentStatus))) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className={css.refundSection}
                    >
                        <div className={css.refundIcon}>💰</div>
                        <div className={css.refundInfo}>
                            <h3>Refund Initiated</h3>
                            <p>
                                {orderData?.walletAmountUsed > 0
                                    ? `₹${orderData.walletAmountUsed} has been credited back to your FoodRiders Wallet.`
                                    : "Our team will verify your UPI transaction and process your refund within 24-48 hours."}
                            </p>
                        </div>
                    </motion.div>
                )}

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className={css.subtitle}
                >
                    We apologize for the inconvenience caused by this cancellation.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className={css.actionArea}
                >
                    <button onClick={() => window.location.href = '/'} className={css.homeBtn}>
                        Back to Home
                    </button>
                    <p className={css.supportText}>
                        Facing issues? Contact support via chat in your profile.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default OrderCancelled;
