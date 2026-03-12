const crypto = require('crypto');

// Use environment variable or fallback to a consistent development key
// In production, ALWAYS use a long, random string in .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'foodriders_development_fallback_key_2026';
const IV_LENGTH = 16; // For AES, this is always 16

// Ensure key is 32 bytes (256 bits) for aes-256-cbc
const getKey = () => {
    return crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substr(0, 32);
};

const encrypt = (text) => {
    if (!text) return null;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(getKey()), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (e) {
        console.error("Encryption Error:", e);
        return null; // Fail safe
    }
};

const decrypt = (text) => {
    if (!text) return null;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(getKey()), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        console.error("Decryption Error:", e);
        return null;
    }
};

module.exports = { encrypt, decrypt };
