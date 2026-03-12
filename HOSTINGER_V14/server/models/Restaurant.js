const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  rating: { type: Number, required: true },
  deliveryTime: { type: Number, required: true },
  phone: { type: String, default: '' }, // For WhatsApp Alerts
  whatsappEnabled: { type: Boolean, default: true },
  image: { type: String },
  location: {
    lat: { type: Number, default: 16.3860 }, // Default to Mahalingapura center
    lng: { type: Number, default: 75.1202 }
  },
  deliveryRadius: { type: Number, default: 5 }, // 5km delivery radius
  deliveryAreas: { type: [String], default: ["Mahalingapura", "Mahalingpur"] },
  isActive: { type: Boolean, default: true }, // Admin soft delete / disable
  displayOrder: { type: Number, default: 0 }, // For ordering restaurants in list
  tags: { type: [String], default: [] },
  categoryGroups: { type: [String], default: [], index: true }, // High-level groups (e.g. Food, Grocery)
  bridgeCategories: { type: [String], default: [], index: true }, // Sub-categories (e.g. Veg, Non Veg, Chicken)
  categories: [
    {
      name: { type: String, required: true },
      isManuallyClosed: { type: Boolean, default: false },
      timings: [
        {
          startTime: { type: String, default: "00:00" },
          endTime: { type: String, default: "23:59" }
        }
      ],
      suggestedNotes: { type: [String], default: [] },
      items: [
        {
          name: { type: String, required: true },
          price: { type: Number, required: true },
          image: { type: String },
          description: { type: String },
          isAvailable: { type: Boolean, default: true },
          sizes: [
            {
              size: { type: String },
              price: { type: Number }
            }
          ]
        }
      ]
    }
  ],
  priceAdjustment: {
    enabled: { type: Boolean, default: false },
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    value: { type: Number, default: 0 }, // e.g., 10 for 10% or 10 for ₹10
    applyTo: { type: String, enum: ['all', 'categories'], default: 'all' },
    targetCategories: { type: [String], default: [] },
    lastModified: {
      by: String,
      at: Date,
      oldValue: Number,
      newValue: Number,
      adjustmentType: String
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', RestaurantSchema); 