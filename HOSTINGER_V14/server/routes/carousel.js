const express = require('express');
const router = express.Router();
const CarouselItem = require('../models/CarouselItem');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for DISK storage (saves images to /uploads/carousel/)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Try root uploads first, then server/uploads
        let uploadPath = path.join(__dirname, '../../uploads/carousel/'); // Root
        if (!fs.existsSync(path.join(__dirname, '../../uploads/'))) {
            uploadPath = path.join(__dirname, '../uploads/carousel/'); // server/uploads
        }

        if (!fs.existsSync(uploadPath)) {
            try {
                fs.mkdirSync(uploadPath, { recursive: true });
            } catch (err) {
                console.error('[Carousel] Failed to create upload directory:', err.message);
                return cb(err);
            }
        }
        console.log(`[Carousel] Saving to: ${uploadPath}`);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueName = 'car-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        cb(null, uniqueName + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Images Only! Allowed: jpeg, jpg, png, webp, gif'));
    }
});

// Admin: Get all items (including hidden)
router.get('/all', auth, async (req, res) => {
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
    try {
        const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
        let items = await CarouselItem.find().sort({ displayOrder: 1 }).lean();

        items = items.map(item => {
            if (item.image && !item.image.startsWith('data:')) {
                // Return only the filename/relative path (e.g., "carousel/car-xxx.webp")
                // to match the public route behavior and allow frontend to prepend /uploads/
                if (item.image.startsWith('http')) {
                    try {
                        const url = new URL(item.image);
                        item.image = url.pathname.replace('/uploads/', '').replace(/^\//, '');
                    } catch (_) { }
                } else if (item.image.startsWith('/uploads/')) {
                    item.image = item.image.replace('/uploads/', '').replace(/^\//, '');
                }
            }
            return item;
        });

        res.json(items);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// User: Get active items
router.get('/', async (req, res) => {
    try {
        let items = await CarouselItem.find({ status: 'Active' }).sort({ displayOrder: 1 }).lean();

        items = items.map(item => {
            if (item.image && !item.image.startsWith('data:')) {
                // Always use relative path for local uploads so it works via
                // both the Vite dev proxy and in production (same-origin).
                // Strip any absolute URL prefix that may have been stored.
                if (item.image.startsWith('http')) {
                    try {
                        const url = new URL(item.image);
                        // Keep only the pathname (e.g. /uploads/carousel/xxx.webp)
                        item.image = url.pathname;
                    } catch (_) {
                        // invalid URL, leave as-is
                    }
                } else {
                    // Relative filename like "carousel/xxx.webp" → "/uploads/carousel/xxx.webp"
                    item.image = `/uploads/${item.image}`;
                }
            }
            return item;
        });

        res.json(items);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Admin: Create item
router.post('/', auth, upload.single('image'), async (req, res) => {
    console.log(`[Carousel] Create Attempt: ${req.user.name} (${req.user.role})`);
    if (!['admin', 'super_admin'].includes(req.user.role)) {
        console.warn(`[Carousel] Unauthorized creation attempt by ${req.user.role}`);
        return res.status(403).json({ msg: 'Forbidden' });
    }
    try {
        const { title, redirectType, redirectTarget, displayOrder, status } = req.body;
        let image = '';

        if (req.file) {
            console.log(`[Carousel] Received file: ${req.file.originalname} (${req.file.size} bytes) → ${req.file.filename}`);
            // Store ONLY the relative filename (not path), backend serves via /uploads/
            image = `carousel/${req.file.filename}`;
        }

        if (!image) {
            console.error('[Carousel] Missing image in request');
            return res.status(400).json({ msg: 'Image is required' });
        }

        const newItem = new CarouselItem({
            title,
            image,
            redirectType,
            redirectTarget,
            displayOrder: Number(displayOrder) || 0,
            status: status || 'Active'
        });

        await newItem.save();

        // Return full image URL in response
        const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
        const response = newItem.toObject();
        response.image = `${baseUrl}/uploads/${response.image}`;

        console.log(`[Carousel] Item created: ${title} with image: ${response.image}`);
        res.status(201).json(response);
    } catch (err) {
        console.error('[Carousel] Error creating item:', err.message);
        res.status(400).json({ msg: 'Error creating carousel item', error: err.message });
    }
});

// Admin: Update item
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
    try {
        const { title, redirectType, redirectTarget, displayOrder, status } = req.body;
        const update = { title, redirectType, redirectTarget, displayOrder: Number(displayOrder), status };

        if (req.file) {
            console.log(`[Carousel] Updating image: ${req.file.originalname} → ${req.file.filename}`);
            update.image = `carousel/${req.file.filename}`;
        }

        const item = await CarouselItem.findByIdAndUpdate(req.params.id, update, { new: true });

        // Return with full URL
        const response = item.toObject();
        const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
        if (response.image && !response.image.startsWith('http') && !response.image.startsWith('data:')) {
            response.image = `${baseUrl}/uploads/${response.image}`;
        }

        res.json(response);
    } catch (err) {
        console.error('[Carousel] Error updating item:', err.message);
        res.status(400).json({ msg: 'Error updating carousel item', error: err.message });
    }
});

// Admin: Delete item
router.delete('/:id', auth, async (req, res) => {
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
    try {
        await CarouselItem.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Carousel item deleted' });
    } catch (err) {
        res.status(400).json({ msg: 'Error deleting carousel item', error: err.message });
    }
});


module.exports = router;
