/**
 * Production Performance & Safety Middleware
 * Adds compression, caching, rate limiting, and error handling
 */

const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Compression middleware
 * Gzip/Brotli compression for all responses
 */
const compressionMiddleware = compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6 // Balance between speed and compression
});

/**
 * Cache control headers
 */
const cacheControl = (req, res, next) => {
    // Static assets - cache for 1 year
    if (req.url.match(/\.(jpg|jpeg|png|webp|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // API responses - no cache
    else if (req.url.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    // HTML - cache for 5 minutes
    else {
        res.setHeader('Cache-Control', 'public, max-age=300');
    }

    next();
};

/**
 * ETag support for conditional requests
 */
const etagMiddleware = (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
        if (data && typeof data === 'string') {
            const etag = require('crypto')
                .createHash('md5')
                .update(data)
                .digest('hex');

            res.setHeader('ETag', `"${etag}"`);

            if (req.headers['if-none-match'] === `"${etag}"`) {
                res.status(304).end();
                return;
            }
        }

        originalSend.call(this, data);
    };

    next();
};

/**
 * Rate limiting for public APIs
 */
const publicApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
        errorCode: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for authenticated admin requests
        return req.headers.authorization && req.headers.authorization.includes('Bearer');
    }
});

/**
 * Strict rate limiting for auth endpoints
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Only 5 login attempts per 15 minutes
    message: {
        success: false,
        message: 'Too many login attempts. Please try again later.',
        errorCode: 'AUTH_RATE_LIMIT'
    }
});

/**
 * Request timeout middleware
 */
const requestTimeout = (timeout = 30000) => {
    return (req, res, next) => {
        req.setTimeout(timeout, () => {
            res.status(408).json({
                success: false,
                message: 'Request timeout',
                errorCode: 'REQUEST_TIMEOUT'
            });
        });
        next();
    };
};

/**
 * Global error handler
 * Catches all errors and returns JSON
 */
const errorHandler = (err, req, res, next) => {
    // Log error
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    // Don't send error if response already sent
    if (res.headersSent) {
        return next(err);
    }

    // Determine status code
    const statusCode = err.statusCode || err.status || 500;

    // Send JSON error response
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'An error occurred. Please try again.'
            : err.message,
        errorCode: err.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * 404 handler
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Resource not found',
        errorCode: 'NOT_FOUND',
        path: req.url
    });
};

/**
 * Health check endpoint
 */
const healthCheck = (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    res.json({
        success: true,
        status: 'healthy',
        uptime: Math.floor(uptime),
        memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
        },
        timestamp: new Date().toISOString()
    });
};

/**
 * Pagination helper
 */
const paginate = (query, page = 1, limit = 20) => {
    const maxLimit = 100; // Never return more than 100 records
    const safeLimit = Math.min(parseInt(limit) || 20, maxLimit);
    const safePage = Math.max(parseInt(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    return {
        limit: safeLimit,
        skip,
        page: safePage
    };
};

/**
 * Prevent double submission
 */
const preventDoubleSubmit = () => {
    const submissions = new Map();

    return (req, res, next) => {
        if (req.method !== 'POST' && req.method !== 'PUT') {
            return next();
        }

        const key = `${req.ip}-${req.url}-${JSON.stringify(req.body)}`;
        const now = Date.now();

        if (submissions.has(key)) {
            const lastSubmit = submissions.get(key);
            if (now - lastSubmit < 3000) { // 3 second window
                return res.status(429).json({
                    success: false,
                    message: 'Please wait before submitting again',
                    errorCode: 'DUPLICATE_SUBMISSION'
                });
            }
        }

        submissions.set(key, now);

        // Clean up old entries
        if (submissions.size > 1000) {
            const cutoff = now - 10000;
            for (const [k, v] of submissions.entries()) {
                if (v < cutoff) submissions.delete(k);
            }
        }

        next();
    };
};

module.exports = {
    compressionMiddleware,
    cacheControl,
    etagMiddleware,
    publicApiLimiter,
    authLimiter,
    requestTimeout,
    errorHandler,
    notFoundHandler,
    healthCheck,
    paginate,
    preventDoubleSubmit
};
