import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import Navbar from '.././Navbars/NavigationBar.jsx'
import MobileNavbar from '.././Navbars/MobileNavbar.jsx';
import SearchBar from '../../utils/SearchBar.jsx'
import Hero3D from './Hero3D.jsx';

import css from './HomePageBanner.module.css'

const deliveryBoy = '/images/delivery-boy-1.png'
const deliveryBoy2 = '/images/delivery-boy-2.png'

let HomePageBanner = () => {
    let [toggleMenu, setToggleMenu] = useState(true);
    const [homeSections, setHomeSections] = useState([]);
    const [activeSection, setActiveSection] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);
    const [loadingRestaurants, setLoadingRestaurants] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/home-sections/sections')
            .then(res => res.json())
            .then(data => setHomeSections(data))
            .catch(err => console.error('Fetch sections error:', err));
    }, []);

    const handleSectionClick = (section) => {
        setActiveSection(section);
        setIsModalOpen(true);
        setSelectedCategory(null);
    };

    const handleCategoryClick = async (categoryName) => {
        setSelectedCategory(categoryName);
        setLoadingRestaurants(true);
        try {
            // Primary attempt: Direct category group match
            const res = await fetch(`/api/restaurants?categoryGroup=${encodeURIComponent(categoryName)}`);
            let data = await res.json();

            // Fallback attempt: If no restaurants found with exact category mapping,
            // try a global fuzzy search for the category name (e.g. "Non Veg")
            if (!Array.isArray(data) || data.length === 0) {
                console.log(`No exact matches for "${categoryName}", trying fuzzy fallback...`);
                const fallbackRes = await fetch(`/api/search?q=${encodeURIComponent(categoryName)}`);
                const fallbackData = await fallbackRes.json();
                data = Array.isArray(fallbackData) ? fallbackData : [];
            }

            setFilteredRestaurants(data);
        } catch (err) {
            console.error('Fetch filtered restaurants error:', err);
            setFilteredRestaurants([]);
        } finally {
            setLoadingRestaurants(false);
        }
    };

    const handleRestaurantSelect = (restaurant) => {
        setIsModalOpen(false);
        const restaurantPath = restaurant.name.toLowerCase().replace(/\s+/g, '-');

        if (restaurant.name === "Foodriders Cafe") {
            navigate(`/restaurant/${restaurantPath}/menu`, {
                state: { restaurantInfo: restaurant, isSpecialMenu: true }
            });
        } else {
            navigate(`/restaurant/${restaurantPath}`, {
                state: { restaurantInfo: restaurant }
            });
        }
    };

    let toggleBanner = toggleMenu ? (
        <>
            <Navbar setToggleMenu={setToggleMenu} toggleMenu={toggleMenu} />
            <Hero3D>
                <div className={css.heroContent}>
                    {/* Left Delivery Boy */}
                    <motion.div
                        className={css.leftDeliveryBoy}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                    >
                        <motion.div
                            animate={{
                                y: [0, -15, 0],
                                rotate: [0, 2, -2, 0]
                            }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            whileTap={{
                                rotate: [0, -3, 3, -3, 0],
                                transition: { duration: 0.4 }
                            }}
                            className={css.boyWrapper}
                            onClick={() => homeSections[0] ? handleSectionClick(homeSections[0]) : null}
                        >
                            <img
                                src={homeSections[0]?.image
                                    ? (homeSections[0].image.startsWith('http') || homeSections[0].image.startsWith('data:')
                                        ? homeSections[0].image
                                        : `/uploads/${homeSections[0].image}`)
                                    : deliveryBoy}
                                alt={homeSections[0]?.title || "Food Delivery"}
                                className={css.boyImg}
                                loading="lazy"
                            />
                            <div className={css.boyLabel}>{homeSections[0]?.title || "Order Food"}</div>
                        </motion.div>
                    </motion.div>

                    {/* Center Content */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={css.centerContent}
                    >
                        <motion.h1
                            className={css.heroTitle}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            FoodRiders
                        </motion.h1>
                        <p className={css.heroSubtitle}>
                            Discover the best food & drinks in <span className={css.locationHighlight}>Mahalingapura</span>
                        </p>
                        <div className={css.searchWrapper}>
                            <SearchBar />
                        </div>
                    </motion.div>

                    {/* Right Delivery Boy */}
                    <motion.div
                        className={css.rightDeliveryBoy}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                    >
                        <motion.div
                            animate={{
                                y: [0, -15, 0],
                                rotate: [0, 2, -2, 0]
                            }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
                            whileTap={{
                                rotate: [0, 3, -3, 3, 0],
                                transition: { duration: 0.4 }
                            }}
                            className={css.boyWrapper}
                            onClick={() => homeSections[1] ? handleSectionClick(homeSections[1]) : null}
                        >
                            <img
                                src={homeSections[1]?.image
                                    ? (homeSections[1].image.startsWith('http') || homeSections[1].image.startsWith('data:')
                                        ? homeSections[1].image
                                        : `/uploads/${homeSections[1].image}`)
                                    : deliveryBoy2}
                                alt={homeSections[1]?.title || "Grocery Delivery"}
                                className={css.boyImg}
                                loading="lazy"
                            />
                            <div className={css.boyLabel}>{homeSections[1]?.title || "Grocery Delivery"}</div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Dynamic Category Modal */}
                <AnimatePresence>
                    {isModalOpen && activeSection && (
                        <motion.div
                            className={css.modalOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setIsModalOpen(false);
                                setSelectedCategory(null);
                            }}
                        >
                            <motion.div
                                className={css.modalContent}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                            >
                                {!selectedCategory ? (
                                    <>
                                        <div className={css.modalHeader}>
                                            <motion.button
                                                className={css.backButton}
                                                onClick={() => setIsModalOpen(false)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                ✕
                                            </motion.button>
                                            <h2>Choose Category</h2>
                                        </div>
                                        <div className={css.categoryGrid}>
                                            {activeSection.categoryGroupId?.categories?.map((cat, i) => (
                                                <motion.div
                                                    key={i}
                                                    className={css.categoryCard}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleCategoryClick(cat.name)}
                                                >
                                                    <div className={css.categoryImgWrapper}>
                                                        <img
                                                            src={cat.image?.startsWith('http') || cat.image?.startsWith('data:')
                                                                ? cat.image
                                                                : `/uploads/${cat.image}`}
                                                            alt={cat.name}
                                                        />
                                                    </div>
                                                    <h3>{cat.name}</h3>
                                                </motion.div>
                                            ))}
                                            {(!activeSection.categoryGroupId?.categories || activeSection.categoryGroupId.categories.length === 0) && (
                                                <p>No categories linked to this group yet.</p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={css.modalHeader}>
                                            <motion.button
                                                className={css.backButton}
                                                onClick={() => setSelectedCategory(null)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                ←
                                            </motion.button>
                                            <h2>{selectedCategory} Restaurants</h2>
                                        </div>
                                        <div className={css.restaurantList}>
                                            {loadingRestaurants ? (
                                                <div className={css.loader}>Finding best places...</div>
                                            ) : filteredRestaurants.length > 0 ? (
                                                filteredRestaurants.map((restaurant, index) => (
                                                    <motion.div
                                                        key={restaurant._id || index}
                                                        className={css.restaurantCard}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                            transition: { delay: index * 0.1 }
                                                        }}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleRestaurantSelect(restaurant)}
                                                    >
                                                        <div className={css.restaurantInfo}>
                                                            <h3>{restaurant.name}</h3>
                                                            <p className={css.cuisine}>{restaurant.cuisine || restaurant.tags?.join(' • ')}</p>
                                                            <div className={css.restaurantMeta}>
                                                                <span className={css.rating}>★ {restaurant.rating}</span>
                                                                <span className={css.time}>{restaurant.deliveryTime || restaurant.time} mins</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className={css.noResults}>
                                                    <p>Our riders are still finding restaurants for this category in Mahalingapura.</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Hero3D>
        </>
    ) : <MobileNavbar setToggleMenu={setToggleMenu} toggleMenu={toggleMenu} />;

    return (
        <>
            {toggleBanner}
        </>
    );
}

export default HomePageBanner;
