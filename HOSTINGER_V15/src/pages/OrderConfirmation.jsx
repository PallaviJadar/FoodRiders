import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import NavigationBar from '../components/Navbars/NavigationBar.jsx';
import MobileNavbar from '../components/Navbars/MobileNavbar.jsx';
import css from './OrderConfirmation.module.css';

const OrderConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { orderId } = location.state || {};
    const [order, setOrder] = useState(null);
    const [toggleMenu, setToggleMenu] = useState(true);
    const { clearCart } = useCart();

    if (!toggleMenu) {
        return <MobileNavbar setToggleMenu={setToggleMenu} toogleMenu={toggleMenu} />
    }

    useEffect(() => {
        if (!orderId) {
            navigate('/');
            return;
        }

        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}`);
                const data = await res.json();
                setOrder(data);

                // Clear cart ONLY after order confirmation page loads
                // This ensures cart persists through payment flow
                clearCart();
            } catch (err) {
                console.error('Error fetching order:', err);
            }
        };

        fetchOrder();
    }, [orderId, navigate, clearCart]);

    if (!order) return <div className={css.loading}>Loading Order Details...</div>;

    const isRazorpay = (order.paymentMethod || order.paymentMode) === 'RAZORPAY';

    return (
        <div className={css.outerDiv}>
            <NavigationBar setToggleMenu={setToggleMenu} />

            <div className={css.content}>
                <div className={css.card}>
                    <div className={css.successIcon}>🎉</div>
                    <h1 className={css.title}>Order Placed Successfully!</h1>
                    <p className={css.orderId}>Order ID: <span>#{order._id}</span></p>

                    <div className={css.statusBanner}>
                        {isRazorpay ? (
                            <div className={css.successStatus}>
                                <h3>Payment Successful!</h3>
                                <p>Your payment through Razorpay has been verified. Restaurant will start preparing soon.</p>
                            </div>
                        ) : (
                            <div className={css.successStatus}>
                                <h3>Order Received (COD)</h3>
                                <p>Your COD order has been received. Please keep cash ready at the door.</p>
                            </div>
                        )}
                    </div>

                    <div className={css.summary}>
                        <h3>Order Summary</h3>
                        <div className={css.itemsList}>
                            {(order.items || []).map((item, idx) => (
                                <div key={idx} className={css.itemRow}>
                                    <span>{item.quantity}x {item.name}</span>
                                    <span>₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                            {order.extraCharges?.map((charge, idx) => (
                                <div key={`extra-${idx}`} className={css.itemRow} style={{ color: '#ff4757' }}>
                                    <span>{charge.name}</span>
                                    <span>+₹{charge.amount}</span>
                                </div>
                            ))}
                        </div>
                        <div className={css.totalRow}>
                            <span>Payment Method</span>
                            <span>{(order.paymentMethod || order.paymentMode) === 'RAZORPAY' ? 'Secure Online Payment' : 'Cash on Delivery'}</span>
                        </div>
                        <div className={css.totalRow}>
                            <span>Total Amount</span>
                            <span>₹{order.totalAmount}</span>
                        </div>
                    </div>

                    <div className={css.actions}>
                        <Link to={`/order-tracking/${order._id}`} state={{ orderId: order._id }} className={css.primaryBtn}>
                            Track My Order
                        </Link>
                        <Link to="/" className={css.secondaryBtn}>
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default OrderConfirmation;
