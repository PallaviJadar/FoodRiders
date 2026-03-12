/**
 * Google Maps Integration Utilities
 * 
 * This file contains helper functions for Google Maps integration.
 * Replace the mock implementations with actual Google Maps API calls in production.
 */

// TODO: Add your Google Maps API key here
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

/**
 * Geocode an address to coordinates using Google Geocoding API
 * @param {Object} address - Address object with street, area, town, pincode
 * @returns {Promise<Object>} - Geocoded result with lat, lng, formatted address
 */
const geocodeAddress = async (address) => {
    const { houseStreet, areaLandmark, townCity, pinCode } = address;

    // Build full address string
    const fullAddress = [houseStreet, areaLandmark, townCity, pinCode]
        .filter(Boolean)
        .join(', ');

    try {
        // TODO: Uncomment this in production and add axios dependency
        /*
        const axios = require('axios');
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: fullAddress,
                key: GOOGLE_MAPS_API_KEY
            }
        });
        
        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const result = response.data.results[0];
            return {
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng,
                googleFormattedAddress: result.formatted_address,
                success: true
            };
        } else {
            throw new Error('Geocoding failed: ' + response.data.status);
        }
        */

        // Mock implementation for development
        // Returns approximate coordinates for Mahalingapura
        const TOWN_CENTER_LAT = 16.3833;
        const TOWN_CENTER_LNG = 75.1167;

        return {
            latitude: TOWN_CENTER_LAT + (Math.random() - 0.5) * 0.02,
            longitude: TOWN_CENTER_LNG + (Math.random() - 0.5) * 0.02,
            googleFormattedAddress: fullAddress,
            success: true,
            note: 'Using mock geocoding. Replace with Google Maps API in production.'
        };

    } catch (error) {
        console.error('Geocoding error:', error);

        // Fallback to town center
        return {
            latitude: 16.3833,
            longitude: 75.1167,
            googleFormattedAddress: fullAddress,
            success: false,
            error: error.message
        };
    }
};

/**
 * Reverse geocode coordinates to address using Google Geocoding API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - Address components
 */
const reverseGeocode = async (lat, lng) => {
    try {
        // TODO: Uncomment this in production
        /*
        const axios = require('axios');
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                latlng: `${lat},${lng}`,
                key: GOOGLE_MAPS_API_KEY
            }
        });
        
        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const result = response.data.results[0];
            const components = result.address_components;
            
            // Extract address components
            const getComponent = (type) => {
                const comp = components.find(c => c.types.includes(type));
                return comp ? comp.long_name : '';
            };
            
            return {
                formattedAddress: result.formatted_address,
                street: getComponent('route'),
                area: getComponent('sublocality') || getComponent('locality'),
                city: getComponent('locality') || getComponent('administrative_area_level_2'),
                pinCode: getComponent('postal_code'),
                success: true
            };
        } else {
            throw new Error('Reverse geocoding failed: ' + response.data.status);
        }
        */

        // Mock implementation for development
        return {
            formattedAddress: `Location near ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            street: 'Main Street',
            area: 'Town Center',
            city: 'Mahalingapura',
            pinCode: '587312',
            success: true,
            note: 'Using mock reverse geocoding. Replace with Google Maps API in production.'
        };

    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return {
            formattedAddress: `${lat}, ${lng}`,
            success: false,
            error: error.message
        };
    }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Validate if coordinates are within service area
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} centerLat - Service center latitude
 * @param {number} centerLng - Service center longitude
 * @param {number} radiusKm - Service radius in kilometers
 * @returns {Object} - Validation result
 */
const isWithinServiceArea = (lat, lng, centerLat, centerLng, radiusKm) => {
    const distance = calculateDistance(lat, lng, centerLat, centerLng);
    return {
        isWithin: distance <= radiusKm,
        distance: distance,
        distanceText: `${distance.toFixed(2)} km`
    };
};

/**
 * Generate Google Maps navigation URL
 * @param {number} originLat - Origin latitude
 * @param {number} originLng - Origin longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 * @param {string} travelMode - Travel mode (driving, walking, bicycling, transit)
 * @returns {string} - Google Maps URL
 */
const getNavigationUrl = (originLat, originLng, destLat, destLng, travelMode = 'driving') => {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=${travelMode}`;
};

/**
 * Generate Google Maps static map image URL
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} zoom - Zoom level (1-20)
 * @param {string} size - Image size (e.g., '400x300')
 * @returns {string} - Static map image URL
 */
const getStaticMapUrl = (lat, lng, zoom = 15, size = '600x400') => {
    // TODO: Uncomment this in production
    /*
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${size}&markers=color:red%7C${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    */

    // Mock implementation
    return `https://via.placeholder.com/${size}?text=Map+${lat},${lng}`;
};

/**
 * Validate town name against keywords
 * @param {string} townName - Town name to validate
 * @param {Array<string>} keywords - Valid town keywords
 * @returns {boolean} - True if town name matches any keyword
 */
const validateTownName = (townName, keywords) => {
    if (!townName) return false;
    const normalized = townName.toLowerCase().trim();
    return keywords.some(keyword => normalized.includes(keyword.toLowerCase()));
};

/**
 * Format address for display
 * @param {Object} address - Address object
 * @returns {string} - Formatted address string
 */
const formatAddress = (address) => {
    const parts = [];

    if (address.houseStreet) parts.push(address.houseStreet);
    if (address.areaLandmark) parts.push(address.areaLandmark);
    if (address.townCity) parts.push(address.townCity);
    if (address.pinCode) parts.push(address.pinCode);

    return parts.filter(Boolean).join(', ');
};

module.exports = {
    geocodeAddress,
    reverseGeocode,
    calculateDistance,
    isWithinServiceArea,
    getNavigationUrl,
    getStaticMapUrl,
    validateTownName,
    formatAddress,
    GOOGLE_MAPS_API_KEY
};
