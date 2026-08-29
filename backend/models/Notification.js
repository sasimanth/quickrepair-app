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
    enum: ['system', 'chat', 'booking', 'payout'],
    default: 'system'
  },
  bookingId: {
    type: String,
    required: false
  }
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
