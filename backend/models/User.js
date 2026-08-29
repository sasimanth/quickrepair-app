const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String
  },
  googleId: {
    type: String
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpires: {
    type: Date
  },
  phoneVerificationOtp: {
    type: String
  },
  phoneVerificationExpires: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0,
    required: true
  },
  lockUntil: {
    type: Date
  },
  isSuspicious: {
    type: Boolean,
    default: false
  },
  suspiciousReasons: {
    type: [String],
    default: []
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'technician', 'admin'],
    default: 'user'
  },
  referralCode: {
    type: String
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  membershipType: {
    type: String,
    enum: ['none', 'monthly', 'yearly'],
    default: 'none'
  },
  membershipExpiry: {
    type: Date,
    default: null
  },
  // Technician specific fields
  jobsCompleted: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 100
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 5.0
  },
  avatar: {
    type: String,
    default: '👨‍🔧'
  },
  membershipActiveDate: {
    type: Date,
    default: null
  },
  premiumBenefits: {
    inspectionsUsed: { type: Number, default: 0 },
    totalSaved: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Ensure unique index only applies when phone is a non-empty string
userSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: 'string', $gt: '' } }
  }
);

userSchema.index(
  { googleId: 1 },
  {
    unique: true,
    partialFilterExpression: { googleId: { $type: 'string', $gt: '' } }
  }
);

userSchema.index(
  { referralCode: 1 },
  {
    unique: true,
    partialFilterExpression: { referralCode: { $type: 'string', $gt: '' } }
  }
);

module.exports = mongoose.model('User', userSchema);
