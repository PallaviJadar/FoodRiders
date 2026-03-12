import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import css from './ConfirmModal.module.css';

const ConfirmModal = ({ isOpen, onCancel, onConfirm, message, title = "Replace cart items?", cancelText = "No, Keep Old", confirmText = "Yes, Clear & Add" }) => {
    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className={css.overlay}>
                <motion.div
                    className={css.modal}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                >
                    <div className={css.iconContainer}>
                        <div className={css.warningIcon}>⚠️</div>
                    </div>

                    <h2 className={css.title}>{title}</h2>
                    <p className={css.message}>{message}</p>

                    <div className={css.actions}>
                        <button className={css.cancelBtn} onClick={onCancel}>
                            {cancelText}
                        </button>
                        <button className={css.confirmBtn} onClick={onConfirm}>
                            {confirmText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default ConfirmModal;
