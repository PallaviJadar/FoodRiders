import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import css from './FoodCategoryCarousel.module.css';

// Import food category images
import pizzaImg from '/icons/Food/pizza.png';
import biryaniImg from '/icons/Food/biryaniC.png';
import chickenImg from '/icons/Food/chicken.png';
import burgerImg from '/icons/Food/burger.png';
import sandwichImg from '/icons/Food/sandwich.png';
import noodelsImg from '/icons/Food/noodels.png';
import dessertImg from '/icons/Food/homestyle.png';

// Import arrow icons
import nextIcon from '/icons/next.png';
import prevIcon from '/icons/prev.png';

// Use inline require to ensure it works without top-level import conflicts in this patching flow
// In production, you would import at top.
import { useRedirect } from '../../utils/redirectHandler';

const FoodCategoryCarousel = () => {
    const { handleRedirect, normalizeRedirectItem } = useRedirect();
    const containerRef = useRef(null);
    const [isAtEnd, setIsAtEnd] = useState(false);
    const [isAtStart, setIsAtStart] = useState(true);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/carousel')
            .then(res => res.json())
            .then(data => {
                setCategories(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch carousel', err);
                setLoading(false);
            });
    }, []);

    const handleCategoryClick = (item) => {
        console.log("Carousel Click:", item);

        // Immediate Robust Fallback for Simple Items (Title only)
        // Check if explicit redirect data is missing/empty
        if ((!item.redirectType || !item.redirectTarget) && item.title) {
            console.log("Using title fallback search:", item.title);
            // Use window.location as nuclear option if navigate fails, but try navigate first
            // navigate(`/show-case?search=${encodeURIComponent(item.title)}`); 

            // Actually, let's trust navigate, but use the Search route logic directly
            // Ensure we trim and encode
            const target = item.title.trim();
            if (target) {
                window.location.href = `/show-case?search=${encodeURIComponent(target)}`;
                return;
            }
        }

        const normalized = normalizeRedirectItem(item);
        handleRedirect(normalized.redirectType, normalized.redirectTarget, normalized.parentId);
    };

    const checkScrollPosition = () => {
        if (containerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
            setIsAtStart(scrollLeft <= 0);
            setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 20);
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScrollPosition);
            checkScrollPosition();
            return () => container.removeEventListener('scroll', checkScrollPosition);
        }
    }, []);

    const handleNextClick = () => {
        if (containerRef.current) {
            const scrollAmount = 300;
            containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const handlePrevClick = () => {
        if (containerRef.current) {
            const scrollAmount = -300;
            containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!loading && categories.length === 0) return null;

    return (
        <div className={css.carouselSection}>
            <motion.h2
                className={css.sectionTitle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                Inspiration for your first order
            </motion.h2>

            <div className={css.carouselWrapper}>
                {/* Prev Button */}
                <motion.button
                    className={`${css.navButton} ${css.prevButton}`}
                    onClick={handlePrevClick}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{ opacity: isAtStart ? 0 : 1, pointerEvents: isAtStart ? 'none' : 'auto' }}
                >
                    <img src={prevIcon} alt="Previous" />
                </motion.button>

                <div
                    className={css.categoriesContainer}
                    ref={containerRef}
                >
                    {categories.map((item) => (
                        <motion.div
                            key={item._id}
                            className={css.categoryItem}
                            onClick={() => handleCategoryClick(item)}
                            whileHover={{
                                y: -10,
                                scale: 1.05,
                                transition: { duration: 0.2 }
                            }}
                            whileTap={{
                                scale: 0.95,
                                y: 0
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 25
                            }}
                        >
                            <div className={css.imageContainer}>
                                <img src={(item.image && (item.image.startsWith('http') || item.image.startsWith('data:') || item.image.startsWith('/'))) ? item.image : `/uploads/${item.image}`} alt={item.title} title={item.title} loading="lazy" />
                            </div>
                            <p className={css.categoryName}>{item.title}</p>
                        </motion.div>
                    ))}
                    {loading && [1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={css.categoryItem} style={{ opacity: 0.5 }}>
                            <div className={css.imageContainer} style={{ background: 'var(--bg-card)' }}></div>
                            <div style={{ height: '1.2rem', width: '80%', background: 'var(--bg-card)', borderRadius: '4px', marginTop: '1rem' }}></div>
                        </div>
                    ))}
                </div>

                {/* Next Button */}
                <motion.button
                    className={`${css.navButton} ${css.nextButton}`}
                    onClick={handleNextClick}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{ opacity: isAtEnd ? 0 : 1, pointerEvents: isAtEnd ? 'none' : 'auto' }}
                >
                    <img src={nextIcon} alt="Next" />
                </motion.button>
            </div>
        </div>
    );
};

export default FoodCategoryCarousel;
