import React from 'react';
import { motion } from 'framer-motion';
import css from './MenuCardPlaceholder.module.css';

const MenuCardPlaceholder = ({ onAdd }) => {
    return (
        <motion.div
            className={css.placeholder}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAdd}
        >
            <div className={css.plusIcon}>+</div>
            <div className={css.text}>
                <h4>No items yet</h4>
                <p>Click to add your first menu item</p>
            </div>
        </motion.div>
    );
};

export default MenuCardPlaceholder;
