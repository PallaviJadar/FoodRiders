const mongoose = require('mongoose');

const usageStatsSchema = new mongoose.Schema({
    totalRegistered: { type: Number, default: 0 },
    last7Days: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    thisYear: { type: Number, default: 0 },
    lastRecalculated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('UsageStats', usageStatsSchema);
