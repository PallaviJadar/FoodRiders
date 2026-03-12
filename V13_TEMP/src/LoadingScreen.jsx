import React from 'react';
import { motion } from 'framer-motion';
import css from './LoadingScreen.module.css';

const LoadingScreen = () => {
    return (
        <div className={css.loaderContainer}>
            <div className={css.loaderContent}>
                <motion.div
                    className={css.logoWrapper}
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <img src="/Logo-Img.png" alt="FoodRiders Logo" className={css.logo} />
                </motion.div>
                <div className={css.progressBarContainer}>
                    <motion.div
                        className={css.progressBar}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>
                <p className={css.loadingText}>Loading deliciousness...</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
