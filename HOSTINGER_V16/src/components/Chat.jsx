import React, { useState, useEffect, useRef } from 'react';
import socket from '.././utils/socket';
import { useNotificationSounds } from '.././hooks/useNotificationSounds';
import css from './Chat.module.css';

// Quick Reply Templates
const CHAT_TEMPLATES = {
    user: ["Where is my order?", "Call me please", "I want to cancel", "Add extra spicy 🌶️", "I'm outside"],
    delivery: ["I'm at the restaurant", "I've picked up the order", "I'm on the way 🛵", "I've reached location 📍", "Please come outside"],
    admin: ["Hello, how can we help?", "Order is being prepared 🍳", "Rider is assigned 🛵", "Please wait a moment", "Thank you for ordering!"]
};

const Chat = ({ orderId, userRole, userName, userImage, deliveryPartner, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const listRef = useRef(null);
    const { playUserNotification } = useNotificationSounds();

    const scrollToBottom = () => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        fetch(`/api/orders/${orderId}`)
            .then(res => res.json())
            .then(data => {
                if (data.messages) setMessages(data.messages);
            });

        socket.connect();

        // Join immediately and on reconnect
        const joinRoom = () => socket.emit('join', orderId);
        joinRoom();
        socket.on('connect', joinRoom);

        socket.on('newMessage', (data) => {
            if (data.orderId === orderId) {
                setMessages(prev => [...prev, data.message]);
                // Play sound for incoming messages
                if (data.message.sender !== userRole) {
                    playUserNotification();
                }
            }
        });

        return () => {
            socket.off('newMessage');
            socket.off('connect', joinRoom);
        };
    }, [orderId]);

    useEffect(scrollToBottom, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        try {
            const res = await fetch(`/api/orders/${orderId}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: userRole,
                    senderName: userName,
                    senderImage: userImage,
                    text: inputText
                })
            });
            if (res.ok) {
                setInputText('');
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const getAvatar = (msg) => {
        if (msg.senderImage) return msg.senderImage;
        if (msg.sender === 'admin') return '/Logo-Img.png'; // Use logo for admin
        return null; // Fallback to initial
    };

    // Get relevant templates based on role (default to user if unknown)
    const templates = CHAT_TEMPLATES[userRole] || CHAT_TEMPLATES['user'];

    return (
        <div className={css.chatWrapper}>
            <div className={css.chatHeader}>
                {/* Header Top Row with Title and Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div className={css.headerInfo}>
                        <div className={css.liveDot}></div>
                        <span>Support & Delivery Chat</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Call Button */}
                        {deliveryPartner && deliveryPartner.mobile && (
                            <a href={`tel:${deliveryPartner.mobile}`} className={css.headerCallBtn} title="Call Driver">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                </svg>
                            </a>
                        )}

                        {/* Close Button for Fullscreen/Mobile */}
                        {onClose && (
                            <button onClick={onClose} className={css.headerCloseBtn}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className={css.headerSubtitle}>Order #{orderId.slice(-6).toUpperCase()}</div>
            </div>

            <div className={css.messageList} ref={listRef}>
                {messages.map((msg, idx) => {
                    const isOwn = msg.sender === userRole;
                    const avatar = getAvatar(msg);
                    const initial = msg.senderName ? msg.senderName.charAt(0).toUpperCase() : '?';

                    return (
                        <div key={idx} className={`${css.messageRow} ${isOwn ? css.ownRow : css.otherRow}`}>
                            {!isOwn && (
                                <div className={css.avatarSide}>
                                    {avatar ? (
                                        <img src={avatar} alt="avatar" className={css.msgAvatar} />
                                    ) : (
                                        <div className={`${css.avatarFallback} ${css[msg.sender + 'Bg']}`}>
                                            {initial}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={css.messageBody}>
                                {!isOwn && <div className={css.msgSenderName}>{msg.senderName}</div>}
                                <div className={css.bubble}>
                                    {msg.text}
                                    <div className={css.msgTime}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                            {isOwn && (
                                <div className={css.avatarSide}>
                                    {avatar ? (
                                        <img src={avatar} alt="avatar" className={css.msgAvatar} />
                                    ) : (
                                        <div className={`${css.avatarFallback} ${css[msg.sender + 'Bg']}`}>
                                            {initial}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Quick Replies */}
            <div className={css.quickReplies}>
                {templates.map((txt, i) => (
                    <button key={i} type="button" className={css.templatePill} onClick={() => setInputText(txt)}>
                        {txt}
                    </button>
                ))}
            </div>

            <form onSubmit={sendMessage} className={css.inputArea}>
                <input
                    type="text"
                    placeholder="Message your rider or support..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" className={css.sendBtn}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default Chat;
