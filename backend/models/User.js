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
    type: String,
    required: true
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
    type: String,
    unique: true,
    sparse: true
  },
  walletBalance: {
    type: Number,
    default: 0
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
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
