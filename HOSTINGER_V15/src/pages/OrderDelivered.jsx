import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import css from './OrderDelivered.module.css';
import NavigationBar from '../components/Navbars/NavigationBar.jsx';
import MobileNavbar from '../components/Navbars/MobileNavbar.jsx';
import { useCart } from '../context/CartContext';

const OrderDelivered = () => {
    const [rating, setRating] = useState(0);
    const [toggleMenu, setToggleMenu] = useState(true);
    const { clearCart, cartItems } = useCart();

    const GOOGLE_REVIEW_URL = "https://www.google.com/search?sca_esv=a6656f2fff5d25f6&hl=en-IN&sxsrf=AE3TifNOHont_Cs3K7OdeNIU42HqjP-CWw:1766217929371&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-E82QlUQxJkZCfsqwtcjghTG48yFwDxdE1pno3i_D67NCHzzaAv6hA1ctVxhxbKtqy7u98JVA4Zl04CmJWmHKW0FpQguv&q=FOOD+RIDER%27S+Reviews&sa=X&ved=2ahUKEwjMsprC2suRAxWOT2wGHbljLd4Q0bkNegQIJBAE&biw=633&bih=725&dpr=1.5";

    // Aggressively ensure cart is cleared
    useEffect(() => {
        if (cartItems.length > 0) {
            clearCart();
            localStorage.removeItem('cartItems'); // Hard remove
        }
    }, [cartItems, clearCart]);

    const handleRating = (value) => {
        setRating(value);
        if (value >= 1) {
            // Optional: Small delay before redirect if you want to show animation
            // But user asked for "redirect to this his google review page" 
            // We can show the button OR redirect automatically.
            // Automatic redirect might be annoying if accidental click.
            // Better to show the button prominently.
        }
    };

    const handleGoogleRedirect = () => {
        window.open(GOOGLE_REVIEW_URL, '_blank');
    };

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
                    className={css.successIcon}
                >
                    🎉
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={css.title}
                >
                    Enjoy your meal!
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={css.subtitle}
                >
                    Your order has been delivered successfully.
                </motion.p>

                <motion.div
                    className={css.starContainer}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span
                            key={star}
                            className={`${css.star} ${star <= rating ? css.starFilled : ''}`}
                            onClick={() => handleRating(star)}
                        >
                            ★
                        </span>
                    ))}
                </motion.div>

                {rating > 0 && (
                    <motion.div
                        className={css.actionArea}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <button onClick={handleGoogleRedirect} className={css.googleBtn}>
                            <span style={{ fontSize: '1.2rem' }}>⭐</span>
                            {rating >= 4 ? 'Rate us on Google' : 'Leave Feedback'}
                        </button>
                        <p className={css.feedbackText}>
                            Your feedback helps us improve!
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default OrderDelivered;
