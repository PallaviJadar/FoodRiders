const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, default: 'User' },
  profilePic: { type: String }, // URL or Path to profile image
  username: { type: String, unique: true, sparse: true },
  mobile: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String }, // Optional/Legacy
  encryptedPassword: { type: String, select: false }, // Legacy Admin Recovery
  pin: { type: String }, // New 4-digit PIN Hash
  role: { type: String, enum: ['user', 'admin', 'delivery_partner', 'super_admin'], default: 'user' },
  deviceToken: { type: String }, // Legacy - single token
  fcmTokens: [
    {
      token: { type: String, required: true },
      deviceType: { type: String, enum: ['mobile', 'desktop'], default: 'desktop' },
      browser: String,
      lastUpdated: { type: Date, default: Date.now }
    }
  ],
  deviceId: { type: String, index: true }, // For referral abuse prevention
  isApproved: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  walletBalance: { type: Number, default: 0 },
  referralCode: { type: String, unique: true },
  referredBy: { type: String }, // Stores the code of the user who referred this user
  referralCount: { type: Number, default: 0 }, // To limit to max 10 rewards
  totalOrders: { type: Number, default: 0 },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Number },
  passwordResetHistory: [
    {
      resetBy: { type: String, default: 'Admin' },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  addresses: [
    {
      label: { type: String, enum: ['Home', 'Work', 'Mom', 'Dad', 'Office', 'Other'], default: 'Home' },
      recipientName: { type: String }, // For "order for someone else"

      // Manual address fields
      houseStreet: { type: String },
      areaLandmark: { type: String },
      townCity: { type: String },
      pinCode: { type: String },

      // Full formatted address
      fullAddress: { type: String, required: true },

      // Google Maps data
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      googleFormattedAddress: { type: String },

      // Metadata
      addressType: { type: String, enum: ['google_map', 'manual'], default: 'manual' },
      isDefault: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

// Generate unique referral code before saving
UserSchema.pre('save', async function (next) {
  if (!this.referralCode) {
    const prefix = 'FR-';
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.referralCode = `${prefix}${random}`;
  }
  next();
});

module.exports = mongoose.model('User', UserSchema); 