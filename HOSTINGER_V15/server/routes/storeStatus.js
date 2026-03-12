const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../storeStatus.json');

// Get current store status
router.get('/', (req, res) => {
    try {
        if (!fs.existsSync(filePath)) {
            // If file doesn't exist, Create it with default Open status
            fs.writeFileSync(filePath, JSON.stringify({ isOpen: true }));
        }
        const data = fs.readFileSync(filePath);
        res.json(JSON.parse(data));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update store status (Admin only)
router.post('/', (req, res) => {
    const { isOpen } = req.body;
    try {
        fs.writeFileSync(filePath, JSON.stringify({ isOpen }));
        res.json({ isOpen });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
