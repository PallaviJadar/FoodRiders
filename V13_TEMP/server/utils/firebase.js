const admin = require('firebase-admin');

let initialized = false;

const fs = require('fs');
const path = require('path');

const initFirebase = () => {
    if (initialized) return admin;

    let projectId = process.env.FIREBASE_PROJECT_ID;
    let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // Fallback: Read from local JSON if ENV is missing (Fix for Hostinger Dashboard 422)
    const keyFilePath = path.join(__dirname, '..', 'config', 'firebase-key.json');
    if ((!projectId || !privateKey) && fs.existsSync(keyFilePath)) {
        try {
            const keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
            projectId = keyFile.project_id;
            clientEmail = keyFile.client_email;
            privateKey = keyFile.private_key;
            console.log('✅ [FIREBASE] Loaded credentials from config file');
        } catch (err) {
            console.error('❌ [FIREBASE] Error reading key file:', err.message);
        }
    }

    if (!projectId || !privateKey || !clientEmail) {
        console.warn('⚠️ [FIREBASE] Missing credentials in environment variables.');
        return null;
    }

    try {
        // Advanced Key Cleaning
        // 1. Remove surrounding quotes (single or double)
        privateKey = privateKey.trim();
        if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
            (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
            privateKey = privateKey.substring(1, privateKey.length - 1);
        }

        // 2. Fix literal backslash-n sequences (common when copying from JSON)
        privateKey = privateKey.replace(/\\n/g, '\n');

        // 3. Ensure the key has proper headers if it got mangled
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
            privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
        }

        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey
                })
            });
            console.log('✅ [FIREBASE] Admin SDK Initialized Successfully');
        }
        initialized = true;
        return admin;
    } catch (error) {
        console.error('❌ [FIREBASE] Initialization Error:', error.message);
        return null;
    }
};

module.exports = { initFirebase, admin };
