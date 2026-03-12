import React from 'react';
import socket from '../../utils/socket';
import { isRestaurantOpen } from '../../utils/RestaurantUtils/timeUtils';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import css from './FeaturedRestaurant.module.css';
import pizzaImg from '/images/Food/pizza.png'; // Using existing pizza image for now

const FeaturedRestaurant = () => {
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = React.useState({
        name: 'FoodRiders Cafe',
        rating: 4.5,
        deliveryTime: 30,
        tags: 'Pizza • Snacks • Beverages'
    });

    const isFetchingRef = React.useRef(false);

    const fetchFeatured = React.useCallback(() => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        fetch('/api/restaurants')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Look for FoodRiders Cafe
                    const found = data.find(r => r.name.toLowerCase().includes('foodriders cafe') || r.name.toLowerCase().includes('foodriderscafe'));
                    if (found) {
                        setRestaurant(found);
                    }
                }
            })
            .catch(err => console.error(err))
            .finally(() => { isFetchingRef.current = false; });
    }, []);

    React.useEffect(() => {
        fetchFeatured();

        const handleUpdate = () => {
            console.log("[FeaturedRestaurant] 📡 Live update received");
            fetchFeatured();
        };

        socket.on('restaurantUpdate', handleUpdate);
        return () => {
            socket.off('restaurantUpdate', handleUpdate);
        };
    }, [fetchFeatured]);

    const handleViewMenu = () => {
        const slug = restaurant.name ? restaurant.name.toLowerCase().replace(/ /g, '-') : 'foodriders-cafe';
        navigate(`/restaurant/${slug}`);
    };

    // Calculate dynamic image URL
    const getImageUrl = () => {
        if (restaurant.image) {
            if (restaurant.image.startsWith('http') || restaurant.image.startsWith('data:')) {
                return restaurant.image;
            }
            return `/uploads/${restaurant.image}`;
        }
        return pizzaImg; // Fallback
    };

    return (
        <div className={css.container}>
            <div className={css.header}>
                <span className={css.subtitle}>Featured Restaurant</span>
                <h2 className={css.title}>Experience the best pizza in town</h2>
            </div>

            <motion.div
                className={css.card}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                <div className={css.cardContent}>
                    <div className={css.imageWrapper}>
                        <motion.img
                            src={getImageUrl()}
                            alt={restaurant.name}
                            className={css.foodImage}
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            loading="lazy"
                            onError={(e) => { e.target.src = pizzaImg }}
                        />
                    </div>
                    <div className={css.infoWrapper}>
                        <div className={css.restaurantHeader}>
                            <h3 className={css.restaurantName}>{restaurant.name}</h3>
                            <span className={css.rating}>★ {restaurant.rating}</span>
                        </div>
                        <p className={css.tags}>{Array.isArray(restaurant.tags) ? restaurant.tags.join(' • ') : (restaurant.tags || 'Pizza • Snacks • Beverages')}</p>
                        <div className={css.deliveryTime}>
                            <span className={css.statusBadge} style={{ color: isRestaurantOpen(restaurant).isOpen ? '#00B138' : '#FF0000', fontWeight: 'bold' }}>
                                {isRestaurantOpen(restaurant).badgeText}
                            </span>
                            <span style={{ margin: '0 8px' }}>•</span>
                            <span className={css.clockIcon}>🕒</span> {restaurant.deliveryTime} min delivery
                        </div>

                        <div className={css.features}>
                            <div className={css.feature}>
                                <span className={css.featureIcon}>🍕</span>
                                <span>Classic Pizzas</span>
                            </div>
                            <div className={css.feature}>
                                <span className={css.featureIcon}>🌶️</span>
                                <span>Spicy Options</span>
                            </div>
                            <div className={css.feature}>
                                <span className={css.featureIcon}>🥤</span>
                                <span>Fresh Beverages</span>
                            </div>
                        </div>

                        <motion.button
                            className={css.viewMenuBtn}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleViewMenu}
                        >
                            View Menu
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default FeaturedRestaurant;
