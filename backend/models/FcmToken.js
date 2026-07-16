const mongoose = require('mongoose');

const fcmTokenSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    index: true
  },
  platform: {
    type: String,
    default: 'Unknown'
  },
  browser: {
    type: String,
    default: 'Unknown'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

// Optimize index for lookup and cleanup
fcmTokenSchema.index({ userId: 1, deviceId: 1 });
fcmTokenSchema.index({ token: 1 });

module.exports = mongoose.model('FcmToken', fcmTokenSchema);
