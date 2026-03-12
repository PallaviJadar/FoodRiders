import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import css from './HomePopup.module.css';

const HomePopup = () => {
    const [popupQueue, setPopupQueue] = useState([]);
    const [currentPopup, setCurrentPopup] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // ================================================
    // 1️⃣ FETCH ALL ACTIVE POPUPS & BUILD QUEUE
    // ================================================
    useEffect(() => {
        const fetchPopups = async () => {
            try {
                const res = await fetch('/api/popups/active');
                if (!res.ok) return;

                const response = await res.json();

                if (!response.success || !response.data || !response.data.popups) {
                    console.log("HomePopup: No valid popup data found.");
                    return;
                }

                const allPopups = response.data.popups;

                if (allPopups.length === 0) {
                    console.log("HomePopup: No active popups.");
                    return;
                }

                // Filter popups based on display mode rules
                const filteredQueue = allPopups.filter(popup => {
                    const freq = popup.displayMode || 'every_refresh';
                    const lastSeenKey = `popup_last_${popup._id}`;
                    let lastSeen = null;
                    let sessionSeen = null;
                    try {
                        lastSeen = localStorage.getItem(lastSeenKey);
                        sessionSeen = sessionStorage.getItem(lastSeenKey);
                    } catch (e) { }

                    const nowTime = new Date().getTime();

                    // Check if popup should be shown
                    if (freq === 'session' || freq === 'once_per_session') {
                        // Skip if already seen in this session
                        if (sessionSeen) return false;
                    } else if (freq === 'day' || freq === 'once_per_day') {
                        // Skip if seen within last 24 hours
                        if (lastSeen && (nowTime - parseInt(lastSeen) < 24 * 60 * 60 * 1000)) return false;
                    } else if (freq === 'once_ever') {
                        // Skip if ever seen
                        if (lastSeen) return false;
                    } else if (freq === 'custom') {
                        const minutes = popup.customInterval || 60;
                        if (lastSeen && (nowTime - parseInt(lastSeen) < minutes * 60 * 1000)) return false;
                    }
                    // 'every_refresh' -> always show

                    return true;
                });

                if (window.location.search.includes('debug=true')) {
                    alert(`Popups: total=${allPopups.length}, shown=${filteredQueue.length}`);
                }

                if (filteredQueue.length > 0) {
                    console.log(`HomePopup: ${filteredQueue.length} popups in queue`);
                    setPopupQueue(filteredQueue);
                }

            } catch (err) {
                console.error("Popup fetch failed", err);
            }
        };

        // Delay initial fetch by 500ms
        const timer = setTimeout(fetchPopups, 500);
        return () => clearTimeout(timer);
    }, []);

    // ================================================
    // 2️⃣ SHOW NEXT POPUP IN QUEUE
    // ================================================
    const showNextPopup = useCallback(() => {
        if (isProcessing) return; // Prevent race conditions

        setIsProcessing(true);

        // Small delay to ensure smooth transition
        setTimeout(() => {
            setPopupQueue(prevQueue => {
                if (prevQueue.length === 0) {
                    setIsProcessing(false);
                    return prevQueue;
                }

                const [nextPopup, ...remainingQueue] = prevQueue;

                // Set current popup and show it
                setCurrentPopup(nextPopup);
                setSecondsLeft(nextPopup.autoCloseSeconds || nextPopup.duration || 10);
                setIsVisible(true);

                // Increment view count
                try {
                    fetch(`/api/popups/track/${nextPopup._id}`, { method: 'POST' }).catch(() => { });
                } catch (e) { }

                setIsProcessing(false);
                return remainingQueue;
            });
        }, 200); // 200ms delay between popups
    }, [isProcessing]);

    // ================================================
    // 3️⃣ START QUEUE WHEN POPUPS ARE LOADED
    // ================================================
    useEffect(() => {
        if (popupQueue.length > 0 && !currentPopup && !isVisible) {
            showNextPopup();
        }
    }, [popupQueue, currentPopup, isVisible, showNextPopup]);

    // ================================================
    // 4️⃣ AUTO-CLOSE COUNTDOWN TIMER
    // ================================================
    useEffect(() => {
        if (!isVisible || !currentPopup || secondsLeft <= 0) return;

        const timer = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    // Auto-close when timer ends
                    handleClose();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isVisible, currentPopup, secondsLeft]);

    // ================================================
    // 5️⃣ CLOSE CURRENT POPUP & SHOW NEXT
    // ================================================
    const handleClose = useCallback(() => {
        if (!currentPopup) return;

        // Mark as viewed
        const now = new Date().getTime();
        const lastSeenKey = `popup_last_${currentPopup._id}`;
        try {
            localStorage.setItem(lastSeenKey, now.toString());
            sessionStorage.setItem(lastSeenKey, 'seen');
        } catch (e) { }

        // Hide current popup
        setIsVisible(false);
        setCurrentPopup(null);
        setSecondsLeft(0);

        // Show next popup after a brief delay
        setTimeout(() => {
            showNextPopup();
        }, 200);
    }, [currentPopup, showNextPopup]);

    // ================================================
    // 6️⃣ HANDLE OVERLAY CLICK
    // ================================================
    const handleOverlayClick = () => {
        if (currentPopup?.allowManualClose) {
            handleClose();
        }
    };

    // ================================================
    // 7️⃣ HANDLE CTA CLICK (TRACKING)
    // ================================================
    const handleCtaClick = () => {
        if (currentPopup) {
            try {
                navigator.sendBeacon(`/api/popups/track/${currentPopup._id}`);
            } catch (e) { }
        }
    };

    // ================================================
    // 8️⃣ DISABLE SCROLL WHEN POPUP IS OPEN
    // ================================================
    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isVisible]);

    // ================================================
    // 9️⃣ RENDER POPUP
    // ================================================
    if (!isVisible || !currentPopup) return null;

    return createPortal(
        <div className={css.overlay} onClick={handleOverlayClick}>
            <div className={css.popupCard} onClick={(e) => e.stopPropagation()}>
                {/* ALWAYS VISIBLE CLOSE BUTTON */}
                <button
                    className={css.closeButton}
                    onClick={handleClose}
                    aria-label="Close"
                >
                    ×
                </button>

                {/* IMAGE (with fallback) */}
                {(currentPopup.promoImage || currentPopup.image) && (
                    <div className={css.imageWrapper}>
                        <img
                            src={(currentPopup.promoImage || currentPopup.image) && ((currentPopup.promoImage || currentPopup.image).startsWith('http') || (currentPopup.promoImage || currentPopup.image).startsWith('data:'))
                                ? (currentPopup.promoImage || currentPopup.image)
                                : `/uploads/${currentPopup.promoImage || currentPopup.image}`}
                            alt={currentPopup.title}
                            onError={(e) => {
                                // Failsafe: Hide image if it fails to load
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                )}

                {/* CONTENT */}
                <div className={css.content}>
                    <span className={css.badge}>Announcement</span>
                    <h3 className={css.title}>{currentPopup.title}</h3>
                    {currentPopup.description && (
                        <p className={css.description}>{currentPopup.description}</p>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className={css.actionButtons}>
                        {currentPopup.phoneNumber && (
                            <a
                                href={`tel:${currentPopup.phoneNumber}`}
                                className={`${css.actionBtn} ${css.callBtn}`}
                                onClick={handleCtaClick}
                            >
                                📞 Call Now
                            </a>
                        )}
                        {currentPopup.whatsappNumber && (
                            <a
                                href={`https://wa.me/${currentPopup.whatsappNumber.replace('+', '')}`}
                                className={`${css.actionBtn} ${css.waBtn}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={handleCtaClick}
                            >
                                💬 WhatsApp
                            </a>
                        )}
                        {currentPopup.websiteUrl && (
                            <a
                                href={currentPopup.websiteUrl}
                                className={`${css.actionBtn} ${css.webBtn}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={handleCtaClick}
                            >
                                🌐 Website
                            </a>
                        )}
                        {currentPopup.ctaLink && (
                            <a
                                href={currentPopup.ctaLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${css.actionBtn} ${css.ctaPrimary}`}
                                onClick={handleCtaClick}
                            >
                                {currentPopup.ctaText || "View Details"}
                            </a>
                        )}
                    </div>

                    {/* COUNTDOWN */}
                    <div className={css.countdown}>
                        Closing automatically in {secondsLeft}s
                        {popupQueue.length > 0 && (
                            <span style={{ marginLeft: '10px', opacity: 0.7 }}>
                                ({popupQueue.length} more)
                            </span>
                        )}
                    </div>
                </div>

                {/* FOOTER NOTE */}
                <div className={css.footerNote}>
                    Some promotions are shown based on time or location.
                </div>

                {/* PROGRESS BAR */}
                <div
                    className={css.progressBar}
                    style={{
                        width: `${(secondsLeft / (currentPopup.autoCloseSeconds || currentPopup.duration || 10)) * 100}%`,
                        transition: 'width 1s linear'
                    }}
                />
            </div>
        </div>,
        document.getElementById('modal')
    );
};

export default HomePopup;
