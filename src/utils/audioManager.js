/**
 * Real-Time Siren & Notification Audio System
 * Handles browser autoplay restrictions and provides reliable audio playback
 */

class AudioManager {
    constructor() {
        this.sounds = {};
        this.isInitialized = false;
        this.activeSirens = new Set();
        this.acknowledgedEvents = new Set();
    }

    /**
     * Initialize audio on first user interaction
     * Call this on any user click/touch
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🎵 Initializing Audio Manager...');
            // Create audio elements
            this.sounds = {
                adminSiren: this.createAudio('/sounds/siren_admin.mp3', true),
                deliverySiren: this.createAudio('/sounds/siren_delivery.mp3', true),
                userNotification: this.createAudio('/sounds/notify_user.mp3', false),
                success: this.createAudio('/sounds/notify_user.mp3', false)
            };

            // Pre-load and set initial volumes
            Object.values(this.sounds).forEach(audio => {
                audio.load();
                audio.volume = 0.5;
                audio.addEventListener('error', (e) => {
                    console.error(`❌ Audio File Error [${audio.src}]:`, e);
                });
            });

            this.isInitialized = true;
            console.log('✅ Audio system initialized (Resilient)');
        } catch (err) {
            console.error('❌ Audio initialization failed:', err);
        }
    }

    createAudio(src, loop = false) {
        const audio = new Audio(src);
        audio.loop = loop;
        audio.preload = 'auto';
        return audio;
    }

    /**
     * Play admin siren (continuous loop until stopped)
     */
    async playAdminSiren(eventId) {
        if (!this.isInitialized) await this.initialize();

        if (eventId && this.acknowledgedEvents.has(eventId)) {
            return;
        }

        try {
            const audio = this.sounds?.adminSiren;
            if (!audio) {
                console.warn('🚨 Admin siren requested but audio not initialized/missing');
                return;
            }

            // If it's already playing and not paused, don't restart (prevents stuttering)
            if (!audio.paused && this.activeSirens.has('admin')) {
                return;
            }

            audio.loop = true;
            audio.volume = 0.95;

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this.activeSirens.add('admin');
                    console.log('🚨 SIREN PLAYING: Admin Alert Active');
                    
                    // 🔥 WhatsApp Style repeating vibration (Buzzes until accepted)
                    if (window.AndroidBridge && window.AndroidBridge.vibrate) {
                        // Vibrate for 5 seconds every time the siren plays
                        window.AndroidBridge.vibrate(5000); 
                    } else if ('vibrate' in navigator) {
                        navigator.vibrate([1000, 500, 1000, 500, 1000]);
                    }
                }).catch(err => {
                    console.warn('⚠️ Siren blocked by browser (waiting for interaction):', err.message);
                    this.activeSirens.delete('admin');
                });
            }
        } catch (err) {
            console.error('❌ Failed to play admin siren:', err);
        }
    }

    /**
     * Stop admin siren
     */
    stopAdminSiren(eventId) {
        const audio = this.sounds?.adminSiren;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        this.activeSirens.delete('admin');
        if (eventId) {
            this.acknowledgedEvents.add(eventId);
        }
        console.log('🔇 Admin siren stopped');
    }

    /**
     * Play delivery partner alert (repeating every 10 seconds)
     */
    async playDeliverySiren(eventId) {
        if (!this.isInitialized) return;

        if (this.acknowledgedEvents.has(eventId)) {
            console.log(`Event ${eventId} already acknowledged, skipping siren`);
            return;
        }

        try {
            const audio = this.sounds?.deliverySiren;
            if (!audio) return;
            audio.volume = 0.7;
            await audio.play();
            this.activeSirens.add('delivery');

            // Vibrate if supported
            if (window.AndroidBridge && window.AndroidBridge.vibrate) {
                window.AndroidBridge.vibrate(500); 
            } else if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }

            console.log('📱 Delivery alert started');
        } catch (err) {
            console.error('Failed to play delivery alert:', err);
        }
    }

    /**
     * Stop delivery siren
     */
    stopDeliverySiren(eventId) {
        const audio = this.sounds?.deliverySiren;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        this.activeSirens.delete('delivery');
        if (eventId) {
            this.acknowledgedEvents.add(eventId);
        }
        console.log('🔇 Delivery alert stopped');
    }

    /**
     * Play user notification (one-time, soft)
     */
    async playUserNotification() {
        if (!this.isInitialized) await this.initialize();

        try {
            const audio = this.sounds?.userNotification;
            if (!audio) return;

            audio.currentTime = 0;
            audio.volume = 0.5; // Softer for users

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.warn('User notification blocked by browser:', err);
                });
            }
            console.log('🔔 User notification played');
        } catch (err) {
            console.error('Failed to play user notification:', err);
        }
    }

    /**
     * Play success sound
     */
    async playSuccess() {
        if (!this.isInitialized) return;

        try {
            const audio = this.sounds?.success;
            if (!audio) return;
            audio.volume = 0.6;
            await audio.play();
            console.log('✅ Success sound played');
        } catch (err) {
            console.error('Failed to play success sound:', err);
        }
    }

    /**
     * Stop all active sirens
     */
    stopAll() {
        Object.values(this.sounds).forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        this.activeSirens.clear();
        console.log('🔇 All sounds stopped');
    }

    /**
     * Check if any siren is currently playing
     */
    isPlaying() {
        return this.activeSirens.size > 0;
    }

    /**
     * Acknowledge an event (prevents replay)
     */
    acknowledge(eventId) {
        this.acknowledgedEvents.add(eventId);

        // Clean up old acknowledgments after 5 minutes
        setTimeout(() => {
            this.acknowledgedEvents.delete(eventId);
        }, 5 * 60 * 1000);
    }

    /**
     * Unlock audio on user interaction (for browsers that block autoplay)
     */
    unlockAudio() {
        if (!this.isInitialized) {
            this.initialize();
        }
    }

    /**
     * Check if admin siren is REALLY playing (not paused by browser)
     */
    isAdminSirenPlaying() {
        if (!this.isInitialized || !this.sounds?.adminSiren) return false;
        const audio = this.sounds.adminSiren;
        return (this.activeSirens.has('admin') && !audio.paused);
    }

    /**
     * Check if delivery siren is currently playing
     */
    isDeliverySirenPlaying() {
        return this.activeSirens.has('delivery');
    }
}

// Create singleton instance
const audioManager = new AudioManager();

// Auto-initialize on first user interaction
if (typeof window !== 'undefined') {
    const initOnInteraction = () => {
        audioManager.initialize();
        // Remove listeners after first interaction
        ['click', 'touchstart', 'keydown'].forEach(event => {
            document.removeEventListener(event, initOnInteraction);
        });
    };

    ['click', 'touchstart', 'keydown'].forEach(event => {
        document.addEventListener(event, initOnInteraction, { once: true });
    });
}

export default audioManager;
