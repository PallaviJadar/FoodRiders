const express = require('express');
const router = express.Router();
const Popup = require('../models/Popup');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- 1. Multer setup for disk storage ---
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
        cb(null, 'pop-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// --- 2. Helper for Safe JSON Responses ---
const safeJson = (res, status, success, message, data = null, errorCode = null) => {
    if (res.headersSent) return;
    return res.status(status).json({
        success,
        message,
        data,
        errorCode
    });
};

// --- PUBLIC ROUTES ---

// @route   GET /api/popups/active
router.get('/active', async (req, res) => {
    try {
        const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
        let activePopups = await Popup.find({
            isActive: true
        }).sort({ displayPriority: -1, createdAt: 1 }).lean();

        if (!activePopups || activePopups.length === 0) {
            return safeJson(res, 200, true, "No active popups", { popups: [] });
        }

        activePopups = activePopups.map(p => {
            if (p.promoImage && !p.promoImage.startsWith('data:')) {
                p.promoImage = p.promoImage.startsWith('http') ? p.promoImage : `${baseUrl}/uploads/${p.promoImage}`;
            }
            return p;
        });

        return safeJson(res, 200, true, "Active popups fetched", { popups: activePopups });
    } catch (err) {
        console.error("Active Popup Error:", err);
        return safeJson(res, 500, false, 'Server Error fetching active popups', null, 'INTERNAL_SERVER_ERROR');
    }
});

// @route   POST /api/popups/track/:id
router.post('/track/:id', async (req, res) => {
    try {
        await Popup.findByIdAndUpdate(req.params.id, { $inc: { clickCount: 1 } });
        return safeJson(res, 200, true, 'Tracked successfully');
    } catch (err) {
        return safeJson(res, 500, false, 'Tracking failed');
    }
});

// --- ADMIN ROUTES ---

// @route   GET /api/popups/admin
router.get('/admin', [auth, admin], async (req, res) => {
    try {
        const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
        let popups = await Popup.find().sort({ isActive: -1, displayPriority: -1, createdAt: -1 }).lean();

        popups = popups.map(p => {
            if (p.promoImage && !p.promoImage.startsWith('data:')) {
                p.promoImage = p.promoImage.startsWith('http') ? p.promoImage : `${baseUrl}/uploads/${p.promoImage}`;
            }
            return p;
        });

        return safeJson(res, 200, true, "Popups fetched", popups);
    } catch (err) {
        return safeJson(res, 500, false, 'Failed to fetch popups', null, 'DB_ERROR');
    }
});

// @route   POST /api/popups/admin
router.post('/admin', [auth, admin], (req, res) => {
    const uploadFields = upload.fields([
        { name: 'promoImage', maxCount: 1 },
        { name: 'image', maxCount: 1 }
    ]);

    uploadFields(req, res, async (err) => {
        if (err) {
            console.error("Popup Upload Error:", err);
            return safeJson(res, 400, false, err.message || 'Image upload failed', null, 'UPLOAD_ERROR');
        }

        try {
            const {
                title, description, popupType,
                ctaText, ctaLink,
                phoneNumber, whatsappNumber, websiteUrl,
                displayPriority, displayMode, autoCloseSeconds, allowManualClose,
                startDate, endDate,
                townTarget, festivalTag,
                isActive
            } = req.body;

            if (!title || !title.trim()) {
                return safeJson(res, 400, false, "Title is mandatory");
            }

            let promoImageUrl = req.body.promoImage || null;
            if (req.files) {
                const file = (req.files.promoImage && req.files.promoImage[0]) || (req.files.image && req.files.image[0]);
                if (file) {
                    promoImageUrl = file.filename;
                }
            }

            if (!promoImageUrl && (!description || !description.trim())) {
                return safeJson(res, 400, false, "Either Promo Image or Description is required");
            }

            const newPopup = new Popup({
                title: title.trim(),
                description: description ? description.trim() : '',
                promoImage: promoImageUrl,
                popupType: popupType || 'general',
                displayMode: displayMode || 'every_refresh',
                displayPriority: parseInt(displayPriority) || 5,
                autoCloseSeconds: parseInt(autoCloseSeconds) || 10,
                allowManualClose: allowManualClose === 'false' ? false : true,
                ctaText: ctaText ? ctaText.trim() : '',
                ctaLink: ctaLink ? ctaLink.trim() : '',
                phoneNumber: phoneNumber ? phoneNumber.trim() : '',
                whatsappNumber: whatsappNumber ? whatsappNumber.trim() : '',
                websiteUrl: websiteUrl ? websiteUrl.trim() : '',
                townTarget: townTarget ? townTarget.trim() : '',
                festivalTag: festivalTag ? festivalTag.trim() : '',
                startDate: startDate || Date.now(),
                endDate: endDate || null,
                isActive: isActive === 'true' || isActive === true
            });

            const savedPopup = await newPopup.save();
            return safeJson(res, 201, true, "Popup created successfully", { popup: savedPopup });

        } catch (serverErr) {
            console.error("Create Popup Logic Error:", serverErr);
            return safeJson(res, 500, false, 'Internal Server Error', null, 'INTERNAL_SERVER_ERROR');
        }
    });
});

// @route   PUT /api/popups/admin/:id
router.put('/admin/:id', [auth, admin], (req, res) => {
    const uploadFields = upload.fields([
        { name: 'promoImage', maxCount: 1 },
        { name: 'image', maxCount: 1 }
    ]);

    uploadFields(req, res, async (err) => {
        if (err) {
            return safeJson(res, 400, false, err.message || 'Image upload failed', null, 'UPLOAD_ERROR');
        }

        try {
            const {
                title, description, popupType,
                ctaText, ctaLink,
                phoneNumber, whatsappNumber, websiteUrl,
                displayPriority, displayMode, autoCloseSeconds, allowManualClose,
                startDate, endDate,
                townTarget, festivalTag,
                isActive
            } = req.body;

            let updateData = {};
            if (title) updateData.title = title.trim();
            if (description !== undefined) updateData.description = description;
            if (popupType) updateData.popupType = popupType;
            if (ctaText !== undefined) updateData.ctaText = ctaText;
            if (ctaLink !== undefined) updateData.ctaLink = ctaLink;
            if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
            if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
            if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
            if (displayPriority) updateData.displayPriority = parseInt(displayPriority);
            if (displayMode) updateData.displayMode = displayMode;
            if (autoCloseSeconds) updateData.autoCloseSeconds = parseInt(autoCloseSeconds);
            if (allowManualClose !== undefined) updateData.allowManualClose = allowManualClose === 'true' || allowManualClose === true;
            if (startDate) updateData.startDate = startDate;
            if (endDate !== undefined) updateData.endDate = endDate;
            if (townTarget !== undefined) updateData.townTarget = townTarget;
            if (festivalTag !== undefined) updateData.festivalTag = festivalTag;
            if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;

            if (req.files) {
                const file = (req.files.promoImage && req.files.promoImage[0]) || (req.files.image && req.files.image[0]);
                if (file) {
                    updateData.promoImage = file.filename;
                }
            }

            const updatedPopup = await Popup.findByIdAndUpdate(
                req.params.id,
                { $set: updateData },
                { new: true }
            );

            if (!updatedPopup) return safeJson(res, 404, false, "Popup not found");
            return safeJson(res, 200, true, "Popup updated successfully", { popup: updatedPopup });

        } catch (serverErr) {
            console.error("Update Popup Logic Error:", serverErr);
            return safeJson(res, 500, false, 'Internal Server Error', null, 'INTERNAL_SERVER_ERROR');
        }
    });
});

// @route   DELETE /api/popups/admin/:id
router.delete('/admin/:id', [auth, admin], async (req, res) => {
    try {
        await Popup.findByIdAndDelete(req.params.id);
        return safeJson(res, 200, true, 'Popup removed');
    } catch (err) {
        return safeJson(res, 500, false, 'Failed to delete', null, err.message);
    }
});


// @route   PATCH /api/popups/admin/:id/status
router.patch('/admin/:id/status', [auth, admin], async (req, res) => {
    try {
        const popup = await Popup.findById(req.params.id);
        if (!popup) return safeJson(res, 404, false, 'Popup not found');
        popup.isActive = !popup.isActive;
        await popup.save();
        return safeJson(res, 200, true, "Status updated", { popup });
    } catch (err) {
        return safeJson(res, 500, false, 'Status update failed', null, err.message);
    }
});

module.exports = router;
