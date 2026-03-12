import React, { useState, useEffect } from 'react';
import Chat from './Chat';
import css from './FloatingChatWidget.module.css';
import socket from '../utils/socket';

const FloatingChatWidget = ({ orderId, userRole, userName, userImage, deliveryPartner }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDriver, setShowDriver] = useState(true);

    // Toggle Chat
    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    // Reset unread count when chat opens
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    // Listen for new messages to update badge (only when closed)
    useEffect(() => {
        const handleNewMessage = (data) => {
            // If the message is for this order AND chat is closed AND it's not from me
            if (data.orderId === orderId && !isOpen && data.message.sender !== userRole) {
                setUnreadCount(prev => prev + 1);
            }
        };

        socket.on('newMessage', handleNewMessage);

        return () => {
            socket.off('newMessage', handleNewMessage);
        };
    }, [orderId, isOpen, userRole]);

    return (
        <div className={css.widgetWrapper}>
            {/* Chat Container - Always mounted to keep connection/sound, but visually hidden if closed */}
            <div className={`${css.chatContainer} ${isOpen ? css.open : ''}`}>
                <Chat
                    orderId={orderId}
                    userRole={userRole}
                    userName={userName}
                    userImage={userImage}
                    deliveryPartner={deliveryPartner}
                    onClose={toggleChat}
                />
            </div>

            {/* Driver Card Logic: Show if closed, driver exists, and explicitly shown by user */}
            {!isOpen && showDriver && deliveryPartner && (
                <div className={css.driverCard}>
                    <button className={css.closeDriverBtn} onClick={(e) => { e.stopPropagation(); setShowDriver(false); }}>×</button>
                    <img
                        src={deliveryPartner.image || '/images/default_user.png'}
                        onError={(e) => e.target.src = '/images/default_user.png'}
                        className={css.driverAvatar}
                        alt="Rider"
                    />
                    <div className={css.driverInfo}>
                        <div className={css.driverName}>{deliveryPartner.fullName || 'Rider'}</div>
                        <div className={css.driverLabel}>Your Delivery Partner</div>
                    </div>
                    {deliveryPartner.mobile && (
                        <a href={`tel:${deliveryPartner.mobile}`} className={css.callBtn}>
                            <svg className={css.phoneIcon} viewBox="0 0 24 24">
                                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                            </svg>
                        </a>
                    )}
                </div>
            )}

            {/* Toggle Button */}
            <button className={`${css.toggleBtn} ${isOpen ? css.open : ''}`} onClick={toggleChat}>
                {isOpen ? (
                    <svg className={css.closeIcon} viewBox="0 0 24 24" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                ) : (
                    <svg className={css.icon} viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                )}

                {/* Unread Badge */}
                {!isOpen && unreadCount > 0 && (
                    <span className={css.badge}>{unreadCount}</span>
                )}
            </button>
        </div>
    );
};

export default FloatingChatWidget;
