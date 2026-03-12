import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import css from './AnnouncementCarousel.module.css';

const AnnouncementCarousel = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [wishModal, setWishModal] = useState({ isOpen: false, annId: null });
    const [wishMessage, setWishMessage] = useState('');

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch('/api/announcements');
            const data = await res.json();
            setAnnouncements(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Fetch announcements error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInteract = async (annId, type = 'wish', message = '') => {
        let deviceId = null;
        try {
            deviceId = localStorage.getItem('deviceId');
        } catch (e) { }

        const guestId = 'guest-' + Math.random().toString(36).substr(2, 9);
        const finalUserId = user?._id || deviceId || guestId;

        if (!deviceId && !user?._id) {
            try {
                localStorage.setItem('deviceId', guestId);
            } catch (e) { }
        }

        try {
            let currentDeviceId = null;
            try { currentDeviceId = localStorage.getItem('deviceId'); } catch (e) { }

            const res = await fetch(`/api/announcements/${annId}/interact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?._id || currentDeviceId,
                    userName: user?.name || 'Guest User',
                    message: message,
                    type
                })
            });
            if (res.ok) {
                // Optimistic update
                setAnnouncements(prev => prev.map(ann =>
                    ann._id === annId
                        ? { ...ann, interactions: [...(ann.interactions || []), { userId: user?._id || currentDeviceId, type, message }] }
                        : ann
                ));
                setWishModal({ isOpen: false, annId: null });
                setWishMessage('');
            } else {
                const data = await res.json();
                if (data.msg === 'Already interacted' && type === 'wish') {
                    alert('You have already congratulated/responded! 🎉');
                }
            }
        } catch (err) {
            console.error('Interaction failed', err);
        }
    };

    const handleViewAction = (ann) => {
        if (ann.linkedRestaurantId && ann.linkedRestaurantId.name) {
            // Track interest if not already done
            let currentDeviceId = null;
            try { currentDeviceId = localStorage.getItem('deviceId'); } catch (e) { }

            const hasInteracted = ann.interactions?.some(i => i.userId === (user?._id || currentDeviceId));
            if (!hasInteracted) {
                handleInteract(ann._id, 'interest');
            }

            const slug = ann.linkedRestaurantId.name.toLowerCase().replace(/ /g, '-');
            navigate(`/Mahalingapura/${slug}`);
        }
    };

    if (loading || announcements.length === 0) return null;

    return (
        <div className={css.outerWrapper}>
            <div className={css.header}>
                <h3 className={css.title}>📢 Today's Specials & Announcements</h3>
                <p className={css.subtitle}>Stay updated with the latest happenings in FoodRiders!</p>
            </div>
            <div className={css.carousel}>
                {announcements.map((ann) => {
                    let currentDeviceId = null;
                    try { currentDeviceId = localStorage.getItem('deviceId'); } catch (e) { }
                    const hasInteracted = ann.interactions?.some(i => i.userId === (user?._id || currentDeviceId));
                    const isWishable = ['Birthday Wishes', 'Festival Wishes', 'New Shop Opening'].includes(ann.type);

                    return (
                        <div key={ann._id} className={css.card}>
                            <div className={css.cardImage}>
                                {ann.image ? (
                                    <img
                                        src={ann.image.startsWith('http') || ann.image.startsWith('data:') ? ann.image : `/uploads/${ann.image}`}
                                        alt={ann.title}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className={css.imgPlaceholder}>{ann.type[0]}</div>
                                )}
                                <span className={css.badge}>{ann.type}</span>
                                {ann.priority && (
                                    <span className={`${css.prioBadge} ${css['prio-' + ann.priority]}`}>
                                        {ann.priority}
                                    </span>
                                )}
                            </div>
                            <div className={css.cardBody}>
                                <h4>{ann.title}</h4>
                                <p>{ann.description}</p>
                                <div className={css.actions}>
                                    {isWishable ? (
                                        <button
                                            className={`${css.wishBtn} ${hasInteracted ? css.wished : ''}`}
                                            onClick={() => setWishModal({ isOpen: true, annId: ann._id })}
                                            disabled={hasInteracted}
                                        >
                                            {hasInteracted ? '🎈 Congratulated!' : '🎉 Congratulate'}
                                        </button>
                                    ) : (
                                        ann.linkedRestaurantId ? (
                                            <button
                                                className={css.viewBtn}
                                                onClick={() => handleViewAction(ann)}
                                            >
                                                {ann.type === 'Promotion / Offer' ? '🔥 View Offer' : '👉 View Details'}
                                            </button>
                                        ) : null
                                    )}
                                    <span className={css.count}>
                                        {ann.interactions?.length || 0} {isWishable ? 'Wishes' : 'Interests'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Wish Modal */}
            {wishModal.isOpen && (
                <div className={css.modalOverlay} onClick={() => setWishModal({ isOpen: false, annId: null })}>
                    <div className={css.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={css.modalHeader}>
                            <h3>🎉 Send Your Wishes</h3>
                            <button className={css.closeBtn} onClick={() => setWishModal({ isOpen: false, annId: null })}>×</button>
                        </div>
                        <div className={css.modalBody}>
                            <p>Write a nice message (optional):</p>
                            <textarea
                                value={wishMessage}
                                onChange={(e) => setWishMessage(e.target.value)}
                                placeholder="Happy New Year! / Congratulations! / Best wishes..."
                                className={css.wishInput}
                            />
                            <button
                                className={css.sendBtn}
                                onClick={() => handleInteract(wishModal.annId, 'wish', wishMessage)}
                            >
                                Send Wish 🎉
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementCarousel;
