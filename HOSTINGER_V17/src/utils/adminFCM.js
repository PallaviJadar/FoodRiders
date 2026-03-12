import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "../firebase";
import axios from "axios";

const VAPID_KEY = "BMp3HcIlMPNWK66EdEAYzBGbaO27ScgLGNE8YrYIEJfoRhwfR6beEfCJluX86EAbkzp6iWq0KphDAXibCnlrBqw";

/**
 * Request notification permission, get FCM token, and save it to the backend.
 * Call this ONCE on admin login/mount.
 */
export const initAdminPushNotifications = async () => {
    try {
        // 1. Check browser support
        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
            console.warn("[FCM] Browser does not support push notifications");
            return null;
        }

        // 2. Request permission (only prompts once per domain)
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("[FCM] Notification permission denied");
            return null;
        }

        // 3. Register service worker
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log("[FCM] Service worker registered");

        // 4. Get FCM messaging instance
        const messaging = await getFirebaseMessaging();
        if (!messaging) {
            console.warn("[FCM] Messaging not supported in this browser");
            return null;
        }

        // 5. Get FCM token using VAPID key
        const fcmToken = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (!fcmToken) {
            console.warn("[FCM] No FCM token received");
            return null;
        }

        console.log("✅ [FCM] Token obtained:", fcmToken.substring(0, 20) + "...");

        // 6. Save token to backend
        const authToken = localStorage.getItem("adminToken") || localStorage.getItem("token");
        if (authToken) {
            await axios.post("/api/admin/save-fcm-token",
                { fcmToken },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            console.log("✅ [FCM] Token saved to backend");
        }

        return fcmToken;
    } catch (err) {
        console.error("[FCM] Init error:", err);
        return null;
    }
};

/**
 * Listen for foreground FCM messages.
 * Returns an unsubscribe function.
 * @param {Function} onNewOrder - callback({ title, body, orderId })
 */
export const listenForForegroundMessages = async (onNewOrder) => {
    try {
        const messaging = await getFirebaseMessaging();
        if (!messaging) return () => { };

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log("🔔 [FCM] Foreground message:", payload);

            const data = payload.data || {};
            const notification = payload.notification || {};

            // Trigger browser notification manually for foreground
            if (Notification.permission === "granted") {
                const n = new Notification(notification.title || "🚨 New Order Received!", {
                    body: notification.body || "Check Admin Panel",
                    icon: "/Logo-Img.png",
                    badge: "/Logo-Img.png",
                    requireInteraction: true,
                    tag: "foodriders-fg-" + (data.orderId || Date.now())
                });
                n.onclick = () => {
                    window.focus();
                    window.location.href = "/admin/orders";
                    n.close();
                };
            }

            // Trigger the callback (for siren, popup, etc.)
            if (onNewOrder) {
                onNewOrder({
                    title: notification.title,
                    body: notification.body,
                    orderId: data.orderId,
                    type: data.type
                });
            }
        });

        return unsubscribe;
    } catch (err) {
        console.error("[FCM] Foreground listener error:", err);
        return () => { };
    }
};
