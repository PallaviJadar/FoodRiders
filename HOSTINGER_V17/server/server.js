const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const compression = require('compression');

/**
 * 🏠 ULTIMATE ROOT RECOVERY (V16)
 * No more guessing. We find exactly where we are on Hostinger.
 */
const rootDir = path.dirname(require.main.filename);
const isServerSubfolder = rootDir.endsWith('server');
const baseDir = isServerSubfolder ? path.join(rootDir, '..') : rootDir;

// 📝 Load Environment ( Dashboard Variables > .builds/config/.env > root/.env )
const envFile = path.join(baseDir, '.builds', 'config', '.env');
if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
}
dotenv.config(); // Also check local .env

const app = express();
const server = require('http').createServer(app);

// 🔌 Socket.io Initialization
const { init } = require('./socket');
const io = init(server);
app.set('io', io);

// Body Parsing & Compression
app.use(compression());
app.use('/api/payment/razorpay/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 🛡️ Broad CORS for Shared Hosting Stability
app.use(cors({ origin: '*', credentials: true }));

// 🔗 Database Connection
const mongoURI = process.env.MONGO_URI;
if (mongoURI) {
    mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('✅ MongoDB Connected Successfully'))
        .catch(err => console.error('❌ MongoDB Connection Fail:', err.message));
} else {
    console.error('🔥 [CRITICAL] MONGO_URI NOT FOUND IN ANY ENV!');
}

/* =============================================
1️⃣ EXPLICIT STATIC ASSET ROUTING (The "Blank Page" Killer)
============================================= */
// We serve every important folder manually with high priority
const staticFolders = ['assets', 'images', 'icons', 'banners', 'sounds', 'BgVd'];
staticFolders.forEach(folder => {
    const folderPath = path.join(baseDir, folder);
    if (fs.existsSync(folderPath)) {
        app.use(`/${folder}`, express.static(folderPath, { maxAge: '30d' }));
    }
});

// Manual 404 for missing static files (Stops them returning index.html)
app.use(['/assets/*', '/images/*', '/icons/*', '/banners/*'], (req, res) => {
    res.status(404).send('Not Found');
});

// Explicit Service Worker Route
app.get(['/sw.js', '/service-worker.js', '/workbox-*.js', '/manifest.*', '/favicon.ico', '/Logo-Img.png'], (req, res) => {
    const file = path.basename(req.path);
    const p = path.join(baseDir, file);
    if (fs.existsSync(p)) {
        if (file.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
        return res.sendFile(p);
    }
    res.status(404).send('Missing critical script');
});

// 🖼️ PERSISTENT UPLOADS (Rule: Store outside 'server' or 'build' for persistence)
const uploadDir = path.join(baseDir, 'uploads');
if (!fs.existsSync(uploadDir)) {
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('📁 Created persistent uploads directory at:', uploadDir);
    } catch (err) {
        console.error('❌ Failed to create uploads directory:', err.message);
    }
}
// Serve uploads with high priority
app.use('/uploads', express.static(uploadDir, { maxAge: '30d', fallthrough: true }));

// Compatibility: Also check server/uploads if it exists (legacy)
const legacyUploadDir = path.join(baseDir, 'server', 'uploads');
if (fs.existsSync(legacyUploadDir) && legacyUploadDir !== uploadDir) {
    app.use('/uploads', express.static(legacyUploadDir, { maxAge: '30d' }));
}

/* =============================================
2️⃣ API ROUTES
============================================= */
app.use((req, res, next) => { req.io = io; next(); });

// Standardized API mounting
app.use('/api/auth', require('./routes/auth'));
app.use('/api/system', require('./routes/systemStats'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/restaurants', require('./routes/restaurant'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/store', require('./routes/storeStatus'));
app.use('/api/delivery-settings', require('./routes/deliverySettings'));
app.use('/api/announcements', require('./routes/announcement'));
app.use('/api/popups', require('./routes/popups'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/carousel', require('./routes/carousel'));
app.use('/api/home-sections', require('./routes/homeSections'));
app.use('/api/address', require('./routes/address'));
app.use('/api/payment-settings', require('./routes/paymentSettings'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/search', require('./routes/search'));
app.use('/api/push', require('./routes/push'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/super', require('./routes/superAdmin'));
app.use('/api/admin/extra-charges', require('./routes/extraCharges'));
app.use('/api/extra-charges', require('./routes/extraCharges'));
app.use('/sitemap.xml', require('./routes/sitemap'));

// Public site settings (for customer pages — no auth required)
app.get('/api/site-settings', async (req, res) => {
    try {
        const SystemSettings = require('./models/SystemSettings');
        let settings = await SystemSettings.findOne().lean();
        res.json({ showUserStats: settings?.showUserStats ?? false });
    } catch (err) {
        res.json({ showUserStats: false });
    }
});


/* =============================================
3️⃣ THE ULTIMATE SPA CATCH-ALL
============================================= */
app.get('*', (req, res) => {
    // 🛡️ Safety: If browser asks for a file (like .js or .css) and it's not found above,
    // NEVER send index.html. Send a real 404. This prevents blank screens.
    if (req.path.includes('.') &&
        !req.path.endsWith('.html') &&
        !req.path.startsWith('/api/') &&
        !req.path.startsWith('/uploads/')) {
        return res.status(404).send('File not found');
    }

    // Never serve index.html for intended API calls
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
        return res.status(404).json({ success: false, msg: 'API Endpoint Not Found' });
    }

    const indexFile = path.join(baseDir, 'index.html');
    if (fs.existsSync(indexFile)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        return res.sendFile(indexFile);
    }
    res.status(404).send('Initializing Application... Please wait 30 seconds.');
});

// Life Preserver
process.on('unhandledRejection', (err) => console.error('Unhandled:', err));
process.on('uncaughtException', (err) => console.error('Uncaught:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Production Active on Port ${PORT}`);
});

module.exports = app;
