const mongoose = require('mongoose');

const deviceSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  technicianId: {
    type: String,
    index: true,
    default: null
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
  browser: {
    type: String,
    default: 'Unknown'
  },
  platform: {
    type: String,
    default: 'Unknown'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  loginTimestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('DeviceSession', deviceSessionSchema);
