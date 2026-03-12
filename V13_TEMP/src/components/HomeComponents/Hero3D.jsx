import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import css from './Hero3D.module.css';

const FloatingIcon = ({ src, index, arrContent, x, y }) => {
    const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;

    // Balanced radii for a visual circle (Phones are taller than wide)
    // 48% Width vs 33% Height creates a perfect round look on 9:16 screens
    const radiusX = isMobile ? 48 : 42;
    const radiusY = isMobile ? 33 : 42;

    const angle = (index / arrContent.length) * 360;
    const posX = Math.cos((angle * Math.PI) / 180) * radiusX;
    const posY = Math.sin((angle * Math.PI) / 180) * radiusY;

    // Desktop parallax, fixed position for mobile stability
    const parallaxX = useTransform(x, [-1, 1], [posX * 0.5, posX * -0.5]);
    const parallaxY = useTransform(y, [-1, 1], [posY * 0.5, posY * -0.5]);

    const style = {
        left: `${50 + posX}%`,
        top: `${50 + posY}%`,
        translateX: '-50%',
        translateY: '-50%',
        x: isMobile ? 0 : parallaxX,
        y: isMobile ? 0 : parallaxY
    };

    return (
        <motion.img
            src={`/banners/icons/${src}`}
            alt="Food Icon"
            className={css.floatingIcon}
            loading="lazy"
            fetchpriority="low"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
                opacity: isMobile ? 0.7 : 0.8,
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0],
            }}
            transition={{
                duration: 0.8,
                delay: index * 0.1,
                scale: {
                    repeat: Infinity,
                    duration: 5 + Math.random(),
                    ease: "easeInOut"
                },
                rotate: {
                    repeat: Infinity,
                    duration: 7 + Math.random(),
                    ease: "easeInOut"
                }
            }}
            style={style}
        />
    );
};

const Hero3D = ({ children }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        x.set((clientX / innerWidth) * 2 - 1);
        y.set((clientY / innerHeight) * 2 - 1);
    };

    const icons = [
        'pizza.png', 'burger.png', 'biryani.png', 'cake.png', 'dosa.png',
        'maggie.png', 'sandwich.png', 'gobi.png', 'fries.png', 'meal.png'
    ];

    return (
        <div className={css.heroContainer} onMouseMove={handleMouseMove}>
            <div className={css.yellowBg}>
                {icons.map((src, index) => (
                    <FloatingIcon
                        key={index}
                        src={src}
                        index={index}
                        arrContent={icons}
                        x={x}
                        y={y}
                    />
                ))}
            </div>

            {/* Content Wrapper */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'none' /* Changed to none so it doesn't block anything */
            }}>
                <div style={{ pointerEvents: 'auto', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Hero3D;
