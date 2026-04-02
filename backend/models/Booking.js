const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: String, // Accepts UUID from InsForge
    required: true,
  },
  userEmail: {
    type: String, // Denormalized for rendering
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  providerId: {
    type: String, // Accepts UUID from InsForge
    default: null,
  },
  providerEmail: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'rejected'],
    default: 'pending',
  },
  date: {
    type: Date,
    required: true,
  },
  deviceType: {
    type: String,
    required: true,
  },
  problemDescription: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  isReviewed: {
    type: Boolean,
    default: false
  },
  unknownProblem: {
    type: Boolean,
    default: false
  },
  serviceOption: {
    type: String,
    enum: ['inspection', 'direct'],
    default: 'direct'
  },
  inspectionFee: {
    type: Number,
    default: 0
  },
  hasSpace: {
    type: Boolean,
    default: true
  },
  serviceLocation: {
    type: String,
    enum: ['on-site', 'off-site', 'gate'],
    default: 'on-site'
  },
  isRestrictedArea: {
    type: Boolean,
    default: false
  },
  isUnderWarranty: {
    type: Boolean,
    default: false
  },
  suggestedTools: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
