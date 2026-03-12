import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyCmA88l25_gi-VEjPkbfctGCFagPHDHrOo",
    authDomain: "foodriders-66fdd.firebaseapp.com",
    projectId: "foodriders-66fdd",
    storageBucket: "foodriders-66fdd.firebasestorage.app",
    messagingSenderId: "1035575609061",
    appId: "1:1035575609061:web:c2b7e2fe33fa8343d2b60c",
    measurementId: "G-Y7RE8XB10R"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.useDeviceLanguage();


// Messaging — only works in browsers that support it (not Safari iOS < 16.4)
let messagingInstance = null;
export const getFirebaseMessaging = async () => {
    if (messagingInstance) return messagingInstance;
    const supported = await isSupported();
    if (supported) {
        messagingInstance = getMessaging(app);
    }
    return messagingInstance;
};

export const requestFCMToken = async () => {
    console.log('[FCM] requestFCMToken sequence started');
    try {
        const messaging = await getFirebaseMessaging();
        if (!messaging) {
            console.warn('[FCM] Messaging not supported/initialized');
            return null;
        }

        let permission = Notification.permission;
        console.log('[FCM] Current permission:', permission);

        if (permission === 'default') {
            console.log('[FCM] Requesting browser permit...');
            permission = await Notification.requestPermission();
            console.log('[FCM] Browser permit result:', permission);
        }

        if (permission === 'granted') {
            console.log('[FCM] Permission GRANTED. Fetching token from Firebase...');
            const token = await getToken(messaging, {
                vapidKey: "BMp3HcIlMPNWK66EdEAYzBGbaO27ScgLGNE8YrYIEJfoRhwfR6beEfCJluX86EAbkzp6iWq0KphDAXibCnlrBqw"
            });
            console.log("[FCM] Token Success:", token);
            return token;
        } else {
            console.warn('[FCM] Permission not granted. Final status:', permission);
        }
    } catch (error) {
        console.error("FCM Error in requestFCMToken:", error);
    }
    return null;
};

// Listen for foreground messages
getFirebaseMessaging().then(messaging => {
    if (messaging) {
        onMessage(messaging, (payload) => {
            console.log("Foreground message:", payload);
        });
    }
});

export default app;
