const mongoose = require('mongoose');

const deliverySlabSchema = new mongoose.Schema({
    maxKm: { type: Number, required: true },
    charge: { type: Number, required: true },
    label: { type: String } // e.g. "Up to 4 KM"
});

const deliverySettingsSchema = new mongoose.Schema({
    baseTownDistance: { type: Number, default: 4 },
    maxServiceDistance: { type: Number, default: 6 },
    slabs: [deliverySlabSchema],
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DeliverySettings', deliverySettingsSchema);
