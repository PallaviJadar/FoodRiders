const crypto = require('crypto');
const Visitor = require('../models/Visitor');

const trackVisitor = async (req, res, next) => {
    try {
        // Skip tracking for common static files or specific paths
        const skipPaths = ['.js', '.css', '.png', '.jpg', '.svg', '.ico', '/api/system/usage-stats'];
        if (skipPaths.some(p => req.path.endsWith(p) || req.path.includes(p))) {
            return next();
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const ua = req.headers['user-agent'] || 'unknown';

        // Simple hash to avoid storing raw PII
        const fingerprint = crypto.createHash('md5').update(`${ip}-${ua}`).digest('hex');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Atomic upsert to prevent duplicates and handle concurrency
        await Visitor.updateOne(
            { fingerprint, date: today },
            { $setOnInsert: { fingerprint, date: today } },
            { upsert: true }
        ).catch(() => { });

        next();
    } catch (err) {
        // Silently fail so visitor experience isn't affected
        next();
    }
};

module.exports = trackVisitor;
