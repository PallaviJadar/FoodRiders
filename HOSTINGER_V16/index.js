const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 1. CONFIG & ENV
const rootDir = __dirname;
const envPaths = [
    path.join(rootDir, '.builds', 'config', '.env'),
    path.join(rootDir, 'server', '.env'),
    path.join(rootDir, '.env')
];

envPaths.forEach(p => {
    if (fs.existsSync(p)) {
        const result = dotenv.config({ path: p });
        if (result.error) {
            console.error(`❌ [ENV] Error loading ${p}:`, result.error);
        } else {
            console.log(`✅ [ENV] Loaded: ${p}`);
        }
    }
});

process.env.NODE_ENV = 'production';
const app = express();
const server = require('http').createServer(app);

// 🔍 PRIMARY HEALTH CHECK (High Priority, NO Rate Limit)
app.get('/ping', (req, res) => res.json({ status: 'pong', time: new Date(), env: process.env.NODE_ENV }));

// Middleware
app.use(compression());

// 🔌 Socket.io Initialization
const { init } = require('./server/socket');
const io = init(server);
app.set('io', io);

// 🚀 FORCE WWW & HTTPS (Except for API calls to prevent upload failures)
app.use((req, res, next) => {
    const host = req.get('host') || '';
    const url = req.url;
    // Bypasses to prevent asset disruption and upload failures
    const shouldSkipRedirect =
        url.startsWith('/api/') ||
        url.startsWith('/socket.io/') ||
        url.startsWith('/sounds/') ||
        url.startsWith('/uploads/') ||
        url.includes('.webp') ||
        url.includes('.mp3') ||
        url.includes('.js') ||
        url.includes('.css');

    if (process.env.NODE_ENV === 'production' && !host.startsWith('www.') && !shouldSkipRedirect) {
        return res.redirect(301, `https://www.foodriders.in${req.originalUrl}`);
    }
    next();
});

// CORS Headers for images and uploads (Fix for domain redirect issue)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Max-Age', '86400');
    next();
});

// Specialized Audio Handling to fix ERR_CACHE_OPERATION_NOT_SUPPORTED
app.use((req, res, next) => {
    if (req.path.startsWith('/sounds/')) {
        const soundPath = path.join(findPublicPath(), req.path);
        if (fs.existsSync(soundPath)) {
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.sendFile(soundPath);
        }
    }
    next();
});

app.use('/api/payment/razorpay/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logger Middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Optimized CORS for Production
const allowedOrigins = [
    'https://www.foodriders.in',
    'https://foodriders.in',
    'http://localhost:3000',
    'http://localhost:5173'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS Policy Block'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

// Basic Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 2000,
    message: "Rate limit exceeded"
});
app.use('/api/', apiLimiter);

// 2. STATIC ASSETS & UPLOADS
function findPublicPath() {
    const paths = [
        path.join(__dirname, "dist"),
        path.join(__dirname, "server", "public"),
        path.join(__dirname, "public_html", "server", "public"),
        path.join(__dirname, "public"),
        path.join(__dirname, "..", "public_html", "server", "public")
    ];
    for (let p of paths) {
        if (fs.existsSync(path.join(p, "index.html"))) {
            console.log(`✅ [SPA] Found Build: ${p}`);
            return p;
        }
    }
    return path.join(__dirname, "server", "public"); // Fallback
};

const findUploadsPath = () => {
    // Priority 1: Persistent path outside build folder (Hostinger standard)
    const persistentPath = path.join(__dirname, "..", "uploads");
    
    // Priority 2: Local project root (for VPS/Local)
    const rootPath = path.join(__dirname, "uploads");
    
    // Priority 3: Legacy server folder
    const serverPath = path.join(__dirname, "server", "uploads");

    const paths = [persistentPath, rootPath, serverPath];
    
    for (let p of paths) {
        if (fs.existsSync(p)) {
            // Check if we can write to it
            try {
                fs.accessSync(p, fs.constants.W_OK);
                console.log(`✅ [PROD-UPLOADS] Using Active Path: ${p}`);
                return p;
            } catch (e) {
                console.warn(`⚠️ [PROD-UPLOADS] Path exists but not writable: ${p}`);
            }
        }
    }

    // Default to persistent path and try to create it
    try {
        fs.mkdirSync(persistentPath, { recursive: true });
        // Create subdirs too
        fs.mkdirSync(path.join(persistentPath, 'original'), { recursive: true });
        fs.mkdirSync(path.join(persistentPath, 'optimized'), { recursive: true });
        fs.mkdirSync(path.join(persistentPath, 'thumb'), { recursive: true });
        console.log(`✅ [PROD-UPLOADS] Created persistent directory at: ${persistentPath}`);
        return persistentPath;
    } catch (err) {
        console.error(`❌ [PROD-UPLOADS] Critical failure creating path: ${persistentPath}`, err.message);
        return rootPath; // fallback
    }
};

const publicPath = findPublicPath();
const uploadsPath = findUploadsPath();

// 📁 CRITICAL MIGRATION: Auto-Rescue images from ephemeral 'server' folders to persistent storage
const migrateOldUploads = async () => {
    const legacyPaths = [
        path.join(__dirname, "server", "uploads"),
        path.join(__dirname, "uploads")
    ];

    if (uploadsPath.includes("..")) { // Only migrate if we found a persistent path outside
        for (const legacy of legacyPaths) {
            if (fs.existsSync(legacy) && legacy !== uploadsPath) {
                try {
                    const files = fs.readdirSync(legacy);
                    if (files.length > 0) {
                        console.log(`🚀 [RESYNC] Found ${files.length} images in ephemeral path ${legacy}. Moving to persistent: ${uploadsPath}`);
                        for (const file of files) {
                            const oldFile = path.join(legacy, file);
                            const newFile = path.join(uploadsPath, file);
                            if (fs.lstatSync(oldFile).isFile() && !fs.existsSync(newFile)) {
                                fs.copyFileSync(oldFile, newFile);
                                // We don't unlink to avoid data loss if something fails
                            }
                        }
                    }
                } catch (e) {
                    console.error(`[MIGRATION_ERROR] Failed to resync images: ${e.message}`);
                }
            }
        }
    }
};
migrateOldUploads().catch(console.error);

// 🖼️ MULTI-LAYER IMAGE SERVING (Stability Rule 14)
// Priority 1: The designated persistent path (Highest priority)
app.use('/uploads', express.static(uploadsPath, { maxAge: '30d' }));
// Priority 2: Fallback to server/uploads if files exist there from old zips
app.use('/uploads', express.static(path.join(__dirname, "server", "uploads"), { maxAge: '30d' }));
// Priority 3: Fallback to root uploads
app.use('/uploads', express.static(path.join(__dirname, "uploads"), { maxAge: '30d' }));
// 🖼️ SMART FALLBACK: Prevent 404 image stalls
app.use('/uploads', (req, res) => {
    // If it's an image request, send a nice placeholder instead of 404
    const ext = path.extname(req.path).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
        return res.redirect('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80');
    }
    res.status(404).json({ error: 'Resource not found' });
});

app.use(express.static(publicPath));

// 3. API ROUTES
app.use((req, res, next) => { req.io = io; next(); });

const registerRoute = (prefix, routeFile) => {
    try {
        const route = require(routeFile);
        app.use(prefix, route);
    } catch (err) {
        console.error(`❌ [ROUTER] CRITICAL FAIL on ${prefix}:`, err.message);
        // Fallback catch-all for this prefix to prevent 404/503
        app.use(prefix, (req, res) => res.status(500).json({ error: 'Route module failed to load', detail: err.message }));
    }
};

registerRoute('/api/auth', './server/routes/auth');
registerRoute('/api/system', './server/routes/systemStats');
registerRoute('/api/user', './server/routes/user');
registerRoute('/api/admin', './server/routes/admin');
registerRoute('/api/restaurants', './server/routes/restaurant');
registerRoute('/api/orders', './server/routes/orders');
registerRoute('/api/store', './server/routes/storeStatus');
registerRoute('/api/delivery-settings', './server/routes/deliverySettings');
registerRoute('/api/announcements', './server/routes/announcement');
registerRoute('/api/popups', './server/routes/popups');
registerRoute('/api/reports', './server/routes/reports');
registerRoute('/api/delivery', './server/routes/delivery');
registerRoute('/api/carousel', './server/routes/carousel');
registerRoute('/api/home-sections', './server/routes/homeSections');
registerRoute('/api/address', './server/routes/address');
registerRoute('/api/payment-settings', './server/routes/paymentSettings');
registerRoute('/api/referrals', './server/routes/referrals');
registerRoute('/api/coupons', './server/routes/coupons');
registerRoute('/api/analytics', './server/routes/analytics');
registerRoute('/api/wallet', './server/routes/wallet');
registerRoute('/api/search', './server/routes/search');
registerRoute('/api/push', './server/routes/push');
registerRoute('/api/payment', './server/routes/payment');
registerRoute('/api/super', './server/routes/superAdmin');
registerRoute('/api/admin/extra-charges', './server/routes/extraCharges');
registerRoute('/api/extra-charges', './server/routes/extraCharges');
registerRoute('/sitemap.xml', './server/routes/sitemap');

// 4. STATUS & HEALTH CHECK
app.get('/api/status', (req, res) => {
    const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
    res.json({
        server: 'Online',
        version: '1.0.4-FCR-PROD',
        database: states[mongoose.connection.readyState],
        dbName: mongoose.connection.name,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'production',
        debug: {
            __dirname,
            publicPath,
            uploadsPath,
            indexExists: fs.existsSync(path.join(publicPath, "index.html"))
        }
    });
});

// TEST NOTIFICATIONS
app.get('/api/system/test-notifications', async (req, res) => {
    const results = {};
    const testOrder = {
        _id: new mongoose.Types.ObjectId(),
        totalAmount: 10,
        userDetails: { name: 'Test User', phone: '9380801462', email: 'foodriders.in@gmail.com' },
        items: [{ name: 'Test Item', quantity: 1, price: 10 }],
        paymentMethod: 'TEST',
        restaurantName: 'Test Restaurant'
    };

    try {
        const { sendAdminOrderEmail } = require('./server/utils/email');
        results.email = await sendAdminOrderEmail(testOrder, 'foodriders.in@gmail.com', 'NEW_ORDER');
    } catch (e) { results.email = { success: false, error: e.message }; }

    try {
        const { sendSMS } = require('./server/utils/sms');
        results.sms = await sendSMS('9380801462', 'Test message from FoodRiders server');
    } catch (e) { results.sms = { success: false, error: e.message }; }

    res.json(results);
});

// 5.1 DATABASE DEBUG SUMMARY
app.get('/api/system/db-debug', async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const stats = {};
        for (let col of collections) {
            stats[col.name] = await mongoose.connection.db.collection(col.name).countDocuments();
        }
        res.json({ success: true, dbName: mongoose.connection.name, collections: stats });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. SPA FALLBACK (FINAL)
app.get('*', (req, res) => {
    // Safety check: Never serve index.html for API or Socket.io paths
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
        return res.status(404).json({
            success: false,
            message: 'API Endpoint Not Found'
        });
    }

    const indexFile = path.join(publicPath, "index.html");
    if (fs.existsSync(indexFile)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        return res.sendFile(indexFile);
    }
    // Return JSON if it's potentially an API call even if it doesn't start with /api/
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    res.status(404).send('Application Loading... Please check your internet connection and refresh.');
});

// 6. GLOBAL CRASH PROTECTION
app.use((err, req, res, next) => {
    console.error('🔥 [SERVER ERROR]:', err);
    if (!res.headersSent) {
        res.status(500).send("Server Error");
    }
});

// 6. SAFE PRODUCTION STARTUP
const mongoURI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 2,
    retryWrites: true,
};

// Safe Startup: Start listening immediately, then connect to DB
if (!server.listening) {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 [SERVER] Production Active on Port ${PORT} | Mode: ${process.env.NODE_ENV || 'production'}`);
    });
}

if (!mongoURI) {
    console.error("🔥 [CRITICAL] MONGO_URI is missing from environment variables!");
} else {
    const warmupCache = async () => {
        try {
            const cache = require('./server/utils/cache');
            const Restaurant = require('./server/models/Restaurant');
            console.log("🔥 [WARMUP] Priming RAM Cache...");

            // Warm up main listing
            const baseUrl = process.env.BASE_URL || `https://www.foodriders.in`;
            const results = await Restaurant.aggregate([
                { $match: { isActive: { $ne: false } } },
                { $sort: { displayOrder: -1, _id: 1 } },
                { $project: { "categories.items": 0 } },
                {
                    $addFields: {
                        image: {
                            $cond: [
                                { $or: [{ $not: ["$image"] }, { $regexMatch: { input: "$image", regex: "^http|^data:" } }] },
                                "$image",
                                { $concat: [baseUrl, "/uploads/", "$image"] }
                            ]
                        }
                    }
                }
            ]);
            cache.getOrSet('public_list_none_none', 30000, () => results);
            console.log("✅ [WARMUP] RAM Cache Primed.");
        } catch (err) {
            console.error("❌ [WARMUP] Failed:", err.message);
        }
    };

    const connectWithRetry = () => {
        if (mongoose.connection.readyState === 1) return;

        console.log("🔄 [DB] Attempting to connect to MongoDB...");
        mongoose.connect(mongoURI, mongoOptions)
            .then(() => {
                console.log(`✅ [DB] Connected to: ${mongoose.connection.name}`);
                console.log("📊 [DB] Host:", mongoose.connection.host);
                warmupCache(); // 🔥 Heat up the engine
            })
            .catch(err => {
                console.error("❌ [DB] MongoDB Connection Error:", err.message);
                console.log("⏳ [DB] Retrying in 5 seconds...");
                setTimeout(connectWithRetry, 5000);
            });
    };

    connectWithRetry();

    mongoose.connection.on('disconnected', () => {
        console.error('🔥 [DB] Lost connection! Internal retry logic engaged.');
        setTimeout(connectWithRetry, 5000);
    });
}

// Global Process Handlers
process.on('unhandledRejection', (err) => {
    console.error('💥 [PROMISE REJECTION]:', err);
});

process.on('uncaughtException', (err) => {
    console.error('💥 [UNCAUGHT EXCEPTION]:', err);
});
