const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Clear all orders (for testing purposes)
router.delete('/clear-all', async (req, res) => {
    try {
        const result = await Order.deleteMany({});
        res.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} orders`,
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error('Error clearing orders:', err);
        res.status(500).json({
            success: false,
            message: 'Error clearing orders',
            error: err.message
        });
    }
});

module.exports = router;
