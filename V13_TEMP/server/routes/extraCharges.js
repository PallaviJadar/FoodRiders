const express = require('express');
const router = express.Router();
const ExtraCharges = require('../models/ExtraCharges');
const auth = require('../middleware/auth');

// Get extra charges settings (Public for simplicity, matching payment settings)
router.get('/', async (req, res) => {
    try {
        let settings = await ExtraCharges.findOne();

        // Create default settings if none exist
        if (!settings) {
            settings = new ExtraCharges({
                systemEnabled: false,
                charges: [
                    {
                        id: 'rain',
                        name: 'Rain Charge',
                        icon: '🌧️',
                        description: 'Applied during rainy weather conditions',
                        enabled: false,
                        type: 'fixed',
                        amount: 10,
                        applyTo: 'delivery'
                    },
                    {
                        id: 'surge',
                        name: 'High Demand Charge',
                        icon: '⚡',
                        description: 'Applied during peak hours to ensure faster delivery',
                        enabled: false,
                        type: 'percentage',
                        amount: 5,
                        applyTo: 'delivery'
                    },
                    {
                        id: 'night',
                        name: 'Night Delivery Charge',
                        icon: '🌙',
                        description: 'Applied for late-hour service',
                        enabled: false,
                        type: 'fixed',
                        amount: 15,
                        applyTo: 'delivery',
                        timeRange: {
                            start: '22:00',
                            end: '06:00'
                        }
                    }
                ]
            });
            await settings.save();
        }

        res.json(settings);
    } catch (err) {
        console.error('Error fetching extra charges:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Toggle system on/off
router.put('/system', auth, async (req, res) => {
    console.log(`[Extra Charges] System toggle attempt. User: ${req.user.fullName}, Role: ${req.user.role}`);
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
    try {
        const { enabled } = req.body;

        let settings = await ExtraCharges.findOne();
        if (!settings) {
            return res.status(404).json({ msg: 'Settings not found' });
        }

        settings.systemEnabled = enabled;
        settings.lastModified = {
            by: req.user.fullName || 'Admin',
            at: new Date(),
            action: `System ${enabled ? 'enabled' : 'disabled'}`
        };

        settings.markModified('systemEnabled');
        await settings.save();

        // Log the change
        console.log(`[Extra Charges] System ${enabled ? 'enabled' : 'disabled'} by ${req.user.fullName || req.user.username || 'Admin'}`);

        res.json({
            msg: `System ${enabled ? 'enabled' : 'disabled'} successfully`,
            systemEnabled: enabled
        });
    } catch (err) {
        console.error('Error updating system status:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Toggle individual charge
router.put('/:chargeId/toggle', auth, async (req, res) => {
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
    try {
        const { chargeId } = req.params;
        const { enabled } = req.body;

        let settings = await ExtraCharges.findOne();
        if (!settings) {
            return res.status(404).json({ msg: 'Settings not found' });
        }

        const chargeIndex = settings.charges.findIndex(c => c.id === chargeId);
        if (chargeIndex === -1) {
            return res.status(404).json({ msg: 'Charge not found' });
        }

        const oldStatus = settings.charges[chargeIndex].enabled;
        settings.charges[chargeIndex].enabled = enabled;

        settings.lastModified = {
            by: req.user.fullName || 'Admin',
            at: new Date(),
            action: `${settings.charges[chargeIndex].name} ${enabled ? 'enabled' : 'disabled'}`
        };

        settings.markModified('charges');
        await settings.save();

        // Log the change
        console.log(`[Extra Charges] ${settings.charges[chargeIndex].name} ${enabled ? 'enabled' : 'disabled'} by ${req.user.fullName || 'Admin'}`);

        res.json({ msg: 'Charge status updated', enabled });
    } catch (err) {
        console.error('Error toggling charge:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Update charge details
router.put('/:chargeId', auth, async (req, res) => {
    if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
    try {
        const { chargeId } = req.params;
        const { type, amount, applyTo, timeRange } = req.body;

        let settings = await ExtraCharges.findOne();
        if (!settings) {
            return res.status(404).json({ msg: 'Settings not found' });
        }

        const chargeIndex = settings.charges.findIndex(c => c.id === chargeId);
        if (chargeIndex === -1) {
            return res.status(404).json({ msg: 'Charge not found' });
        }

        const oldValue = `${settings.charges[chargeIndex].type === 'fixed' ? '₹' : ''}${settings.charges[chargeIndex].amount}${settings.charges[chargeIndex].type === 'percentage' ? '%' : ''}`;

        settings.charges[chargeIndex].type = type;
        settings.charges[chargeIndex].amount = amount;
        if (applyTo) {
            settings.charges[chargeIndex].applyTo = applyTo;
        }
        if (timeRange) {
            settings.charges[chargeIndex].timeRange = timeRange;
        }

        const newValue = `${type === 'fixed' ? '₹' : ''}${amount}${type === 'percentage' ? '%' : ''}`;

        settings.lastModified = {
            by: req.user.fullName || 'Admin',
            at: new Date(),
            action: `${settings.charges[chargeIndex].name} updated: ${oldValue} → ${newValue}`
        };

        settings.markModified('charges');
        await settings.save();

        // Log the change
        console.log(`[Extra Charges] ${settings.charges[chargeIndex].name} updated by ${req.user.fullName || 'Admin'}: ${oldValue} → ${newValue}`);

        res.json({ msg: 'Charge updated successfully' });
    } catch (err) {
        console.error('Error updating charge:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get active charges for checkout (public endpoint)
router.get('/active', async (req, res) => {
    try {
        const settings = await ExtraCharges.findOne();

        if (!settings || !settings.systemEnabled) {
            return res.json({ systemEnabled: false, charges: [] });
        }

        // Filter only enabled charges
        const activeCharges = settings.charges.filter(c => c.enabled);
        console.log(`[Extra Charges] Active check. Enabled: ${activeCharges.length}/${settings.charges.length}`);

        // Check time-based charges (like night charge) using IST (UTC+5:30)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(now.getTime() + istOffset);
        const currentTime = `${String(istDate.getUTCHours()).padStart(2, '0')}:${String(istDate.getUTCMinutes()).padStart(2, '0')}`;

        const applicableCharges = activeCharges.filter(charge => {
            // "Always" applies if timeRange is missing or incomplete
            const isAlways = !charge.timeRange || !charge.timeRange.start || !charge.timeRange.end;

            if (isAlways) return true;

            const { start, end } = charge.timeRange;

            // Handle overnight time ranges (e.g., 22:00 to 06:00)
            if (start > end) {
                return currentTime >= start || currentTime < end;
            } else {
                return currentTime >= start && currentTime < end;
            }
        });

        console.log(`[Extra Charges] Returning ${applicableCharges.length} applicable charges: ${applicableCharges.map(c => c.id).join(', ')}`);

        res.json({
            systemEnabled: true,
            charges: applicableCharges.map(c => ({
                id: c.id,
                name: c.name,
                icon: c.icon,
                description: c.description,
                type: c.type,
                amount: c.amount
            }))
        });
    } catch (err) {
        console.error('Error fetching active charges:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
