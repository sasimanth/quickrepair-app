const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String, // Accepts the InsForge UUID
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['system', 'chat', 'booking'],
    default: 'system'
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
