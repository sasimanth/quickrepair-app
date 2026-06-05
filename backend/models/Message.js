const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  senderId: {
    type: String, // String to support InsForge UUIDs seamlessly
    required: true
  },
  senderName: {
    type: String, // Optional human-readable name for UI ease
  },
  text: {
    type: String,
    default: ''
  },
  mediaUrl: {
    type: String,
    default: null
  },
  mediaType: {
    type: String,
    enum: ['text', 'image', 'audio'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDelivered: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
