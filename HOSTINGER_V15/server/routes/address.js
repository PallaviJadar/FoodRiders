const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { geocodeAddress: geocodeAddressUtil, calculateDistance, formatAddress } = require('../utils/googleMaps');

// Town validation configuration
const TOWN_CONFIG = {
    validPinCode: '587312',
    townKeywords: ['mahalingapura', 'mahalingpur', 'mahalingpuram', 'mlp'],
    serviceCenterLat: 16.3833, // Mahalingapura approximate center
    serviceCenterLng: 75.1167,
    maxServiceRadiusKm: 7
};

// Validate if address is within service area
const validateServiceArea = (address) => {
    const { pinCode, townCity, latitude, longitude } = address;

    // Check 1: PIN code match
    if (pinCode === TOWN_CONFIG.validPinCode) {
        return { valid: true, reason: 'PIN code match' };
    }

    // Check 2: Town keyword match
    if (townCity) {
        const normalizedTown = townCity.toLowerCase().trim();
        const hasKeyword = TOWN_CONFIG.townKeywords.some(keyword =>
            normalizedTown.includes(keyword)
        );
        if (hasKeyword) {
            return { valid: true, reason: 'Town keyword match' };
        }
    }

    // Check 3: Geocoded location within service radius
    if (latitude && longitude) {
        const distance = calculateDistance(
            latitude, longitude,
            TOWN_CONFIG.serviceCenterLat, TOWN_CONFIG.serviceCenterLng
        );
        if (distance <= TOWN_CONFIG.maxServiceRadiusKm) {
            return { valid: true, reason: 'Within service radius', distance };
        }
    }

    return {
        valid: false,
        message: 'Delivery is available only within Mahalingapura (PIN 587312). You can order for someone inside this area.'
    };
};

// Geocode manual address using utility module
const geocodeAddress = async (addressData) => {
    return await geocodeAddressUtil(addressData);
};

// --- ROUTES ---

// 1. Validate Address (Used by UI)
router.post('/validate', async (req, res) => {
    try {
        const { addressType, ...addressData } = req.body;

        let finalAddress = { ...addressData };

        // If manual address, geocode it first
        if (addressType === 'manual') {
            const geocoded = await geocodeAddress(addressData);
            finalAddress = {
                ...addressData,
                latitude: geocoded.latitude,
                longitude: geocoded.longitude,
                googleFormattedAddress: geocoded.googleFormattedAddress
            };
        }

        // Validate service area
        const validation = validateServiceArea(finalAddress);

        if (!validation.valid) {
            return res.status(400).json({
                valid: false,
                message: validation.message
            });
        }

        res.json({
            valid: true,
            address: finalAddress,
            validationReason: validation.reason,
            distance: validation.distance
        });

    } catch (error) {
        console.error('Address validation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Geocode Address Independent
router.post('/geocode', async (req, res) => {
    try {
        const addressData = req.body;
        const result = await geocodeAddress(addressData);
        res.json(result);
    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Get User Addresses
router.get('/user/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('addresses');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user.addresses || []);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// 4. Secure Save Address (NEW)
router.post('/save', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found (Token Invalid)' });

        const newAddress = req.body;

        // Only validate if address doesn't have coordinates (not pre-validated)
        // If address has lat/lng, it was already validated during checkout
        if (!newAddress.latitude || !newAddress.longitude) {
            const validation = validateServiceArea(newAddress);
            if (!validation.valid) {
                return res.status(400).json({ error: validation.message });
            }
        }

        if (newAddress.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses.push(newAddress);
        await user.save();

        res.status(201).json({
            message: 'Address saved successfully',
            address: user.addresses[user.addresses.length - 1]
        });
    } catch (error) {
        console.error('Save address error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 5. Unsecure Save Address (LEGACY - for backward compat)
router.post('/user/:userId/save', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const newAddress = req.body;
        const validation = validateServiceArea(newAddress);
        if (!validation.valid) return res.status(400).json({ error: validation.message });

        if (newAddress.isDefault) user.addresses.forEach(addr => addr.isDefault = false);
        user.addresses.push(newAddress);
        await user.save();

        res.status(201).json({
            message: 'Address saved successfully',
            address: user.addresses[user.addresses.length - 1]
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
