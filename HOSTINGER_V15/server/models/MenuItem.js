const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true }, // Link to the Restaurant model
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: {
    type: String, // store base64 string
    required: false
  },

  category: { type: String }, // e.g., 'Starters', 'Main Course', 'Drinks'
  isSpecialOffer: { type: Boolean, default: false },
  offerLabel: { type: String }, // e.g., "50% OFF"
  offerPrice: { type: Number },
  sizeOptions: [{ // Optional: for items with different sizes/prices
    size: { type: String, required: true },
    price: { type: Number, required: true }
  }]
});

module.exports = mongoose.model('MenuItem', MenuItemSchema); 