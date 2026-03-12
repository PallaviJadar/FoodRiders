import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise = null;

export const getDeviceId = async () => {
    try {
        if (!fpPromise) {
            fpPromise = FingerprintJS.load();
        }
        const fp = await fpPromise;
        const result = await fp.get();
        return result.visitorId;
    } catch (error) {
        console.error('Error getting device ID:', error);
        // Return a fallback ID based on browser info
        return `fallback_${navigator.userAgent.substring(0, 20)}`;
    }
};
