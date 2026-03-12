import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { ADMIN_CONTACT } from '../../helpers/contact';
import css from './FloatingThemeToggle.module.css';

const DraggableButton = ({ children, initialBottom, initialRight, onClick, className }) => {
    // We track if the button has been moved. If not, we use bottom/right CSS.
    const [hasMoved, setHasMoved] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 }); // Will be set on first drag start
    const [isDragging, setIsDragging] = useState(false);

    const dragStartOffset = useRef({ x: 0, y: 0 });
    const buttonRef = useRef(null);
    const DRAG_THRESHOLD = 5;
    const initialPointerDownPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handlePointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const newX = e.clientX - dragStartOffset.current.x;
            const newY = e.clientY - dragStartOffset.current.y;

            setPosition({ x: newX, y: newY });
        };

        const handlePointerUp = (e) => {
            setIsDragging(false);
            const movedDistance = Math.sqrt(
                Math.pow(e.clientX - initialPointerDownPos.current.x, 2) +
                Math.pow(e.clientY - initialPointerDownPos.current.y, 2)
            );

            if (movedDistance < DRAG_THRESHOLD && onClick) {
                onClick(e);
            }
        };

        if (isDragging) {
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        }

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDragging, onClick]);

    const handlePointerDown = (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();

        const rect = buttonRef.current.getBoundingClientRect();

        // If this is the first move, we need to initialize absolute position from current rect
        if (!hasMoved) {
            setPosition({ x: rect.left, y: rect.top });
            setHasMoved(true);
        }

        setIsDragging(true);
        initialPointerDownPos.current = { x: e.clientX, y: e.clientY };

        // Recalculate offset based on current mouse pos relative to element
        dragStartOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const style = hasMoved ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none'
    } : {
        position: 'fixed',
        bottom: initialBottom,
        right: initialRight,
        zIndex: 9999,
        cursor: 'grab',
        touchAction: 'none'
    };

    return (
        <div
            ref={buttonRef}
            className={className}
            style={style}
            onPointerDown={handlePointerDown}
        // onClick is handled by pointerUp logic to differentiate click vs drag
        >
            {children}
        </div>
    );
};

const FloatingThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const [showSupport, setShowSupport] = useState(false);

    return (
        <>
            {/* Theme Toggle */}
            <DraggableButton
                initialBottom="100px"
                initialRight="20px"
                className={css.standaloneToggle}
                onClick={toggleTheme}
            >
                <button
                    className={`${css.floatingBtn} ${css.themeBtn}`}
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    style={{ pointerEvents: 'none' }}
                >
                    <span className={css.icon}>
                        {theme === 'light' ? '🌙' : '☀️'}
                    </span>
                </button>
            </DraggableButton>

            {/* Support Toggle */}
            <DraggableButton
                initialBottom="30px"
                initialRight="20px"
                className={css.standaloneToggle}
                onClick={() => setShowSupport(!showSupport)}
            >
                <AnimatePresence>
                    {showSupport && (
                        <motion.div
                            className={css.supportMenu}
                            initial={{ opacity: 0, scale: 0.8, y: 10, originX: 1, originY: 1 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            style={{ position: 'absolute', bottom: '60px', right: '0' }}
                        >
                            <div className={css.supportHeader}>Help & Support 🎧</div>
                            <div className={css.troubleText}>Issues with Payment, Order or Login PIN?</div>
                            <button
                                className={css.supportLink}
                                onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${ADMIN_CONTACT.phone}`; }}
                                style={{ pointerEvents: 'auto' }}
                            >
                                <span>📞</span> Call Admin
                            </button>
                            <button
                                className={css.supportLink}
                                onClick={(e) => { e.stopPropagation(); window.location.href = `https://wa.me/${ADMIN_CONTACT.whatsapp}?text=${encodeURIComponent(ADMIN_CONTACT.whatsappMsg)}`; }}
                                style={{ pointerEvents: 'auto' }}
                            >
                                <span>💬</span> WhatsApp Us
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    className={`${css.floatingBtn} ${css.supportBtn} ${showSupport ? css.active : ''}`}
                    title="Help & Support"
                    style={{ pointerEvents: 'none' }}
                >
                    <span className={css.icon}>
                        {showSupport ? '✕' : '🎧'}
                    </span>
                </button>
            </DraggableButton>
        </>
    );
};

export default FloatingThemeToggle;



