const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Order = require('../models/Order');
const multer = require('multer');
const path = require('path');

// Multer Storage Configuration using memory storage
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for base64
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
    }
});

// @route   POST api/user/upload-profile-pic
// @desc    Upload profile picture (Base64)
router.post('/upload-profile-pic', auth, upload.single('profilePic'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: 'Please upload a file' });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const base64Image = req.file.buffer.toString("base64");
        user.profilePic = `data:${req.file.mimetype};base64,${base64Image}`;
        await user.save();

        res.json({
            msg: 'Profile picture updated',
            profilePic: user.profilePic
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET api/user/profile
// @desc    Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
        let user = await User.findById(req.user.id).select('-password').lean();

        if (user && user.profilePic && !user.profilePic.startsWith('data:')) {
            user.profilePic = user.profilePic.startsWith('http') ? user.profilePic : `${baseUrl}${user.profilePic}`;
        }

        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});


// @route   PUT api/user/profile
// @desc    Update user profile (fullName only)
router.put('/profile', auth, async (req, res) => {
    try {
        const { fullName } = req.body;
        const user = await User.findById(req.user.id);
        if (fullName) user.fullName = fullName;
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/user/orders
// @desc    Get user orders
router.get('/orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST api/user/addresses
// @desc    Add new address
router.post('/addresses', auth, async (req, res) => {
    try {
        const { type, address, isDefault } = req.body;
        const user = await User.findById(req.user.id);

        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses.push({ type, address, isDefault });
        await user.save();
        res.json(user.addresses);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/user/addresses/:addrId
// @desc    Delete address
router.delete('/addresses/:addrId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.addrId);
        await user.save();
        res.json(user.addresses);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST api/user/update-token
// @desc    Update FCM device token (supports multi-token)
router.post('/update-token', auth, async (req, res) => {
    try {
        const { token, deviceType, browser } = req.body;
        if (!token) return res.status(400).json({ msg: 'Token is required' });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Update legacy field for backward compatibility
        user.deviceToken = token;

        // Multi-token logic
        if (!user.fcmTokens) user.fcmTokens = [];

        // Check if token already exists
        const tokenIndex = user.fcmTokens.findIndex(t => t.token === token);
        if (tokenIndex > -1) {
            user.fcmTokens[tokenIndex].lastUpdated = Date.now();
            user.fcmTokens[tokenIndex].deviceType = deviceType || user.fcmTokens[tokenIndex].deviceType;
            user.fcmTokens[tokenIndex].browser = browser || user.fcmTokens[tokenIndex].browser;
        } else {
            // Keep max 5 tokens per user to prevent document bloat
            if (user.fcmTokens.length >= 5) {
                user.fcmTokens.shift(); // Remove oldest
            }
            user.fcmTokens.push({
                token,
                deviceType: deviceType || 'desktop',
                browser: browser || 'unknown',
                lastUpdated: Date.now()
            });
        }

        await user.save();
        res.json({ success: true, msg: 'Device token updated' });
    } catch (err) {
        console.error('[FCM] Token Update Error:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
