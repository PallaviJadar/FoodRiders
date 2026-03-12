const express = require('express');
const router = express.Router();
const DeliverySettings = require('../models/DeliverySettings');

// Initial setup helper
const initSettings = async () => {
    const existing = await DeliverySettings.findOne();
    if (!existing) {
        await DeliverySettings.create({
            baseTownDistance: 4,
            maxServiceDistance: 7,
            slabs: [
                { maxKm: 4, charge: 30, label: "Up to 4 KM" },
                { maxKm: 5, charge: 40, label: "4 - 5 KM" },
                { maxKm: 6, charge: 50, label: "5 - 6 KM" },
                { maxKm: 7, charge: 60, label: "6 - 7 KM" }
            ]
        });
    }
};

// Get current settings
router.get('/', async (req, res) => {
    try {
        await initSettings();
        const settings = await DeliverySettings.findOne();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch delivery settings' });
    }
});

// Update settings
router.post('/update', async (req, res) => {
    try {
        const { baseTownDistance, maxServiceDistance, slabs } = req.body;
        let settings = await DeliverySettings.findOne();
        if (!settings) {
            settings = new DeliverySettings();
        }
        settings.baseTownDistance = baseTownDistance;
        settings.maxServiceDistance = maxServiceDistance;
        settings.slabs = slabs;
        settings.lastUpdated = Date.now();
        await settings.save();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update delivery settings' });
    }
});

module.exports = router;
