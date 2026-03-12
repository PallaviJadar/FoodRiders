const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const auth = require('../middleware/auth');
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
        cb(null, 'ann-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Admin: Create announcement
router.post('/', auth, upload.single('image'), async (req, res) => {
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
    try {
        const { type, title, description, linkedRestaurantId, startDate, endDate, priority } = req.body;
        let image = req.body.image || '';

        if (req.file) {
            image = req.file.filename;
        }

        const announcement = new Announcement({
            type,
            title,
            description,
            image,
            linkedRestaurantId: linkedRestaurantId || null,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            priority: priority || 'MEDIUM'
        });

        await announcement.save();
        res.status(201).json(announcement);
    } catch (err) {
        console.error('Error creating announcement:', err);
        res.status(400).json({ msg: 'Error creating announcement', error: err.message });
    }
});

// Admin: Update announcement
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Forbidden' });
    try {
        const { type, title, description, linkedRestaurantId, startDate, endDate, isActive, priority } = req.body;
        const update = { type, title, description, linkedRestaurantId: linkedRestaurantId || null, startDate, endDate, isActive, priority };

        if (req.file) {
            update.image = req.file.filename;
        }

        const announcement = await Announcement.findByIdAndUpdate(req.params.id, update, { new: true });
        res.json(announcement);
    } catch (err) {
        console.error('Error updating announcement:', err);
        res.status(400).json({ msg: 'Error updating announcement', error: err.message });
    }
});

// User/Admin: Fetch all announcements (Active & Within Date)
router.get('/', async (req, res) => {
    try {
        const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
        let announcements = await Announcement.find({ isActive: true })
            .populate('linkedRestaurantId', 'name')
            .sort({ createdAt: -1 })
            .lean();

        announcements = announcements.map(ann => {
            if (ann.image && !ann.image.startsWith('data:')) {
                ann.image = ann.image.startsWith('http') ? ann.image : `${baseUrl}/uploads/${ann.image}`;
            }
            return ann;
        });

        res.json(announcements);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// Admin: Fetch all announcements (including inactive/expired)
router.get('/admin-list', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Forbidden' });
    try {
        const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
        let announcements = await Announcement.find().sort({ createdAt: -1 }).lean();

        announcements = announcements.map(ann => {
            if (ann.image && !ann.image.startsWith('data:')) {
                ann.image = ann.image.startsWith('http') ? ann.image : `${baseUrl}/uploads/${ann.image}`;
            }
            return ann;
        });

        res.json(announcements);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// Admin: Delete announcement
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Forbidden' });
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Announcement deleted' });
    } catch (err) {
        res.status(400).json({ msg: 'Error deleting announcement', error: err.message });
    }
});


// User: Interact (Wish/Like)
router.post('/:id/interact', async (req, res) => {
    const { userId, userName, message, type = 'wish' } = req.body;
    if (!userId) return res.status(400).json({ msg: 'UserId required' });

    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).json({ msg: 'Announcement not found' });

        // Check if user already interacted
        const alreadyInteracted = announcement.interactions.some(i => i.userId === userId);
        if (alreadyInteracted) {
            return res.status(400).json({ msg: 'Already interacted' });
        }

        announcement.interactions.push({ userId, userName, message, type });
        await announcement.save();
        res.json({ msg: 'Interaction saved', count: announcement.interactions.length });
    } catch (err) {
        res.status(400).json({ msg: 'Interaction failed', error: err.message });
    }
});

module.exports = router;
