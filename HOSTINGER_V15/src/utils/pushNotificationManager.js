/**
 * PWA Push Notification Manager
 * Handles push subscriptions, permissions, and notification delivery
 */

// Vibration patterns per role
const VIBRATION_PATTERNS = {
    admin: [800, 300, 800, 300, 800], // Long urgent vibration
    delivery: [500, 200, 500],         // Medium vibration
    user: [200]                        // Soft vibration
};

class PushNotificationManager {
    constructor() {
        this.registration = null;
        this.subscription = null;
        this.permissionGranted = false;
        this.silentHoursEnabled = false;
        this.silentHoursStart = '23:00'; // 11:00 PM
        this.silentHoursEnd = '07:00';   // 7:00 AM
    }

    /**
     * Initialize service worker and check permission
     */
    async initialize() {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Worker not supported');
            return false;
        }

        if (!('PushManager' in window)) {
            console.warn('Push API not supported');
            return false;
        }

        try {
            // Register service worker
            this.registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });

            console.log('✅ Service Worker registered');

            // Check if already subscribed
            this.subscription = await this.registration.pushManager.getSubscription();

            if (this.subscription) {
                console.log('✅ Already subscribed to push');
                this.permissionGranted = true;
            }

            // Check current permission
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                this.permissionGranted = true;
            }

            // Load silent hours settings
            this.loadSilentHoursSettings();

            return true;
        } catch (err) {
            console.error('Service Worker registration failed:', err);
            return false;
        }
    }

    /**
     * Request push notification permission
     * Only call after meaningful user action
     */
    async requestPermission(role = 'user') {
        if (!this.registration) {
            console.error('Service Worker not registered');
            return false;
        }

        if (typeof window === 'undefined' || !('Notification' in window)) {
            console.warn('Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            console.log('Permission already granted');
            return true;
        }

        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                console.log('✅ Push permission granted');
                this.permissionGranted = true;

                // Subscribe to push
                await this.subscribe(role);
                return true;
            } else {
                console.log('❌ Push permission denied');
                this.permissionGranted = false;
                return false;
            }
        } catch (err) {
            console.error('Permission request failed:', err);
            return false;
        }
    }

    /**
     * Subscribe to push notifications
     */
    async subscribe(role = 'user') {
        if (!this.registration) {
            console.error('Service Worker not registered');
            return null;
        }

        try {
            // Check if already subscribed
            let subscription = await this.registration.pushManager.getSubscription();

            if (!subscription) {
                // Create new subscription
                const vapidPublicKey = await this.getVapidPublicKey();

                subscription = await this.registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
                });

                console.log('✅ Push subscription created');
            }

            // Send subscription to backend
            await this.sendSubscriptionToBackend(subscription, role);

            this.subscription = subscription;
            return subscription;
        } catch (err) {
            console.error('Push subscription failed:', err);
            return null;
        }
    }

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribe() {
        if (!this.subscription) {
            console.log('No active subscription');
            return true;
        }

        try {
            await this.subscription.unsubscribe();

            // Remove from backend
            await this.removeSubscriptionFromBackend(this.subscription);

            this.subscription = null;
            console.log('✅ Unsubscribed from push');
            return true;
        } catch (err) {
            console.error('Unsubscribe failed:', err);
            return false;
        }
    }

    /**
     * Send subscription to backend
     */
    async sendSubscriptionToBackend(subscription, role) {
        try {
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription,
                    role,
                    userId: this.getUserId(),
                    deviceInfo: this.getDeviceInfo()
                })
            });

            if (response.ok) {
                console.log('✅ Subscription sent to backend');
            } else {
                console.error('Failed to send subscription to backend');
            }
        } catch (err) {
            console.error('Error sending subscription:', err);
        }
    }

    /**
     * Remove subscription from backend
     */
    async removeSubscriptionFromBackend(subscription) {
        try {
            await fetch('/api/push/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ subscription })
            });
        } catch (err) {
            console.error('Error removing subscription:', err);
        }
    }

    /**
     * Get VAPID public key from backend
     */
    async getVapidPublicKey() {
        try {
            const response = await fetch('/api/push/vapid-public-key');
            const data = await response.json();
            return data.publicKey;
        } catch (err) {
            console.error('Failed to get VAPID key:', err);
            // Fallback key (replace with your actual key)
            return 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
        }
    }

    /**
     * Show local notification (for testing or fallback)
     */
    async showNotification(title, options = {}) {
        if (!this.registration) {
            console.error('Service Worker not registered');
            return;
        }

        if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
            console.warn('Notification permission not granted or supported');
            return;
        }

        // Check silent hours
        if (this.isInSilentHours()) {
            console.log('Silent hours active, suppressing vibration');
            options.vibrate = undefined;
            options.silent = true;
            title = `${title} (silent mode)`;
        }

        try {
            await this.registration.showNotification(title, {
                icon: '/Logo-Img.png',
                badge: '/Logo-Img.png',
                ...options
            });
        } catch (err) {
            console.error('Failed to show notification:', err);
        }
    }

    /**
     * Vibrate device based on role
     */
    vibrate(role = 'user') {
        if (!('vibrate' in navigator)) {
            console.warn('Vibration API not supported');
            return;
        }

        // Don't vibrate during silent hours
        if (this.isInSilentHours()) {
            console.log('Silent hours active, skipping vibration');
            return;
        }

        const pattern = VIBRATION_PATTERNS[role] || VIBRATION_PATTERNS.user;
        navigator.vibrate(pattern);
    }

    /**
     * Check if current time is in silent hours
     */
    isInSilentHours() {
        if (!this.silentHoursEnabled) return false;

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const start = this.silentHoursStart;
        const end = this.silentHoursEnd;

        // Handle overnight range (e.g., 23:00 - 07:00)
        if (start > end) {
            return currentTime >= start || currentTime < end;
        } else {
            return currentTime >= start && currentTime < end;
        }
    }

    /**
     * Configure silent hours
     */
    configureSilentHours(enabled, startTime, endTime) {
        this.silentHoursEnabled = enabled;
        this.silentHoursStart = startTime;
        this.silentHoursEnd = endTime;

        // Save to localStorage
        try {
            localStorage.setItem('silentHoursEnabled', enabled);
            localStorage.setItem('silentHoursStart', startTime);
            localStorage.setItem('silentHoursEnd', endTime);
        } catch (e) {
            console.warn("Storage restricted", e);
        }

        console.log(`Silent hours ${enabled ? 'enabled' : 'disabled'}: ${startTime} - ${endTime}`);
    }

    /**
     * Load silent hours settings from localStorage
     */
    loadSilentHoursSettings() {
        try {
            const enabled = localStorage.getItem('silentHoursEnabled');
            const start = localStorage.getItem('silentHoursStart');
            const end = localStorage.getItem('silentHoursEnd');

            if (enabled !== null) this.silentHoursEnabled = enabled === 'true';
            if (start) this.silentHoursStart = start;
            if (end) this.silentHoursEnd = end;
        } catch (e) { }
    }

    /**
     * Helper: Convert VAPID key
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    /**
     * Get user ID from auth context
     */
    getUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user._id || user.id || 'guest';
        } catch (e) {
            return 'guest';
        }
    }

    /**
     * Get device info
     */
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height
        };
    }

    /**
     * Check if app is installed as PWA
     */
    isInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
    }
}

// Create singleton instance
const pushManager = new PushNotificationManager();

export default pushManager;
