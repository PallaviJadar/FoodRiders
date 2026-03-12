const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for disk storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = path.join(__dirname, '../../uploads/');
        if (!fs.existsSync(uploadPath)) {
            uploadPath = path.join(__dirname, '../uploads/');
        }
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, 'qr_payment_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Upload (Saves to disk)
router.post('/upload-qr', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: req.file.filename });
});

// GET
router.get('/', async (req, res) => {
    try {
        const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
        let settings = await SystemSettings.findOne().lean();
        if (!settings) settings = await new SystemSettings().save();

        if (settings.qrImageUrl && !settings.qrImageUrl.startsWith('data:')) {
            const prefix = settings.qrImageUrl.startsWith('qr_payment_') ? '/uploads/' : '/';
            settings.qrImageUrl = settings.qrImageUrl.startsWith('http') ?
                settings.qrImageUrl :
                `${baseUrl}${prefix}${settings.qrImageUrl}`;
        }

        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});


// PUT
router.put('/', async (req, res) => {
    try {
        const updateData = {};
        const {
            isCodEnabled, isUpiEnabled, isRazorpayEnabled,
            upiId, upiName, qrImageUrl, paymentPhone, autoCancelMinutes,
            platformFee, packagingFee, deliveryFee, customCharges,
            tipsEnabled, tipPresets, freeDelivery, notificationAlerts
        } = req.body || {};

        if (isCodEnabled !== undefined) updateData.isCodEnabled = isCodEnabled;
        if (isUpiEnabled !== undefined) updateData.isUpiEnabled = isUpiEnabled;
        if (isRazorpayEnabled !== undefined) updateData.isRazorpayEnabled = isRazorpayEnabled;
        if (upiId !== undefined) updateData.upiId = upiId;
        if (upiName !== undefined) updateData.upiName = upiName;
        if (qrImageUrl !== undefined) updateData.qrImageUrl = qrImageUrl;
        if (paymentPhone !== undefined) updateData.paymentPhone = paymentPhone;
        if (autoCancelMinutes !== undefined) updateData.autoCancelMinutes = autoCancelMinutes;

        // Billing
        if (platformFee !== undefined) updateData.platformFee = platformFee;
        if (packagingFee !== undefined) updateData.packagingFee = packagingFee;
        if (deliveryFee !== undefined) updateData.deliveryFee = deliveryFee;
        if (customCharges !== undefined) updateData.customCharges = customCharges;

        // Tips & Free Delivery
        if (tipsEnabled !== undefined) updateData.tipsEnabled = tipsEnabled;
        if (tipPresets !== undefined) updateData.tipPresets = tipPresets;
        if (freeDelivery !== undefined) updateData.freeDelivery = freeDelivery;
        if (notificationAlerts !== undefined) updateData.notificationAlerts = notificationAlerts;

        const settings = await SystemSettings.findOneAndUpdate({}, updateData, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        });

        // Socket — broadcast to ALL connected clients for real-time payment method updates
        if (req.io) {
            try {
                req.io.emit('settingsUpdate', settings);
                req.io.emit('paymentSettingsUpdate', {
                    isCodEnabled: settings.isCodEnabled,
                    isUpiEnabled: settings.isUpiEnabled,
                    isRazorpayEnabled: settings.isRazorpayEnabled
                });
            } catch (e) { }
        }

        res.json(settings);
    } catch (err) {
        console.error('Update Error:', err);
        res.status(500).json({ error: 'Failed to update settings', details: err.message });
    }
});

module.exports = router;
