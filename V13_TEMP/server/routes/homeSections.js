const express = require('express');
const router = express.Router();
const CategoryGroup = require('../models/CategoryGroup');
const HomeDeliverySection = require('../models/HomeDeliverySection');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cache = require('../utils/cache');

// Multer setup using memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- Category Groups ---

router.get('/groups', async (req, res) => {
    try {
        const fetcher = async () => {
            const baseUrl = process.env.BASE_URL || `https://www.foodriders.in`;
            let groups = await CategoryGroup.find().lean();
            return groups.map(g => {
                if (g.image && !g.image.startsWith('data:')) {
                    g.image = g.image.startsWith('http') ? g.image : `${baseUrl}/uploads/${g.image}`;
                }
                return g;
            });
        };
        const results = await cache.getOrSet('home_groups', 3600000, fetcher); // 1 hour
        res.json(results);
    } catch (err) {
        console.error("Home Groups Error:", err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.post('/groups', auth, async (req, res) => {
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
    try {
        const group = new CategoryGroup(req.body);
        await group.save();
        cache.purgeAll(); // Clear any cached listings
        res.status(201).json(group);
    } catch (err) {
        res.status(400).json({ msg: 'Error creating group', error: err.message });
    }
});

router.put('/groups/:id', auth, async (req, res) => {
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
    try {
        const group = await CategoryGroup.findByIdAndUpdate(req.params.id, req.body, { new: true });
        cache.purgeAll();
        res.json(group);
    } catch (err) {
        res.status(400).json({ msg: 'Error updating group', error: err.message });
    }
});

router.delete('/groups/:id', auth, async (req, res) => {
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
    try {
        await CategoryGroup.findByIdAndDelete(req.params.id);
        cache.purgeAll();
        res.json({ msg: 'Group deleted' });
    } catch (err) {
        res.status(400).json({ msg: 'Error deleting group', error: err.message });
    }
});

// --- Delivery Sections ---

router.get('/sections', async (req, res) => {
    try {
        const fetcher = async () => {
            const baseUrl = process.env.BASE_URL || `https://www.foodriders.in`;
            let sections = await HomeDeliverySection.find({ isActive: true }).sort({ displayOrder: 1 }).populate('categoryGroupId').lean();
            return sections.map(s => {
                if (s.image && !s.image.startsWith('data:')) {
                    s.image = s.image.startsWith('http') ? s.image : `${baseUrl}/uploads/${s.image}`;
                }
                return s;
            });
        };
        const results = await cache.getOrSet('home_sections_public', 3600000, fetcher);
        res.json(results);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.get('/sections/all', auth, async (req, res) => {
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
    try {
        const baseUrl = process.env.BASE_URL || `https://www.foodriders.in`;
        let sections = await HomeDeliverySection.find().sort({ displayOrder: 1 }).populate('categoryGroupId').lean();

        sections = sections.map(s => {
            if (s.image && !s.image.startsWith('data:')) {
                s.image = s.image.startsWith('http') ? s.image : `${baseUrl}/uploads/${s.image}`;
            }
            return s;
        });

        res.json(sections);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.post('/sections', auth, upload.single('image'), async (req, res) => {
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
    try {
        const { title, categoryGroupId, displayOrder, isActive } = req.body;
        let image = req.body.image || '';

        if (req.file) {
            const base64Image = req.file.buffer.toString("base64");
            image = `data:${req.file.mimetype};base64,${base64Image}`;
        }

        const section = new HomeDeliverySection({
            title,
            image,
            categoryGroupId,
            displayOrder: Number(displayOrder) || 0,
            isActive: isActive === 'true' || isActive === true
        });

        await section.save();
        cache.purgeAll();
        res.status(201).json(section);
    } catch (err) {
        res.status(400).json({ msg: 'Error creating section', error: err.message });
    }
});

router.put('/sections/:id', auth, upload.single('image'), async (req, res) => {
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
    try {
        const update = { ...req.body };
        if (req.file) {
            const base64Image = req.file.buffer.toString("base64");
            update.image = `data:${req.file.mimetype};base64,${base64Image}`;
        }
        const section = await HomeDeliverySection.findByIdAndUpdate(req.params.id, update, { new: true });
        cache.purgeAll();
        res.json(section);
    } catch (err) {
        res.status(400).json({ msg: 'Error updating section', error: err.message });
    }
});

router.delete('/sections/:id', auth, async (req, res) => {
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
    try {
        await HomeDeliverySection.findByIdAndDelete(req.params.id);
        cache.purgeAll();
        res.json({ msg: 'Section deleted' });
    } catch (err) {
        res.status(400).json({ msg: 'Error deleting section', error: err.message });
    }
});

// Helper to upload category images (Convert to Base64)
router.post('/upload-category-image', auth, upload.single('image'), async (req, res) => {
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const base64Image = req.file.buffer.toString("base64");
    const base64Result = `data:${req.file.mimetype};base64,${base64Image}`;

    res.json({ filename: base64Result });
});


module.exports = router;
