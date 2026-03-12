const mongoose = require('mongoose');

const CategoryGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    categories: [
        {
            name: { type: String, required: true },
            image: { type: String, required: true } // Filename in uploads
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('CategoryGroup', CategoryGroupSchema);
