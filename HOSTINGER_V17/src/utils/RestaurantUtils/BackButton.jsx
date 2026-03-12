import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import css from './BackButton.module.css';

const BackButton = ({ className = '' }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show on home page
    if (location.pathname === '/') return null;

    return (
        <motion.button
            className={`${css.backButton} ${className}`}
            onClick={() => navigate(-1)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Go Back"
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className={css.btnText}>Back</span>
        </motion.button>
    );
};

export default BackButton;
