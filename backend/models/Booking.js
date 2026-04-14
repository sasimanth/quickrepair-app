const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: String, // Kept as String to maintain backward compatibility with legacy BSON data
    default: null,
  },
  userEmail: {
    type: String,
    default: null,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    default: null, // Allow null if using string-based service matching
  },
  serviceName: {
    type: String,
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
    enum: ['pending', 'queued', 'assigned', 'accepted', 'in_progress', 'quote_pending', 'completed', 'rejected'],
    default: 'pending',
  },
  date: {
    type: Date,
    required: true,
  },
  deviceType: {
    type: String,
    default: 'Unknown Device',
  },
  problemDescription: {
    type: String,
    required: true, // Will map to 'problem' from BookingFlow
  },
  problemId: {
    type: String,
    default: null,
  },
  location: {
    type: String,
    required: true, // Will map to 'address' from BookingFlow
  },
  timeSlot: {
    type: String,
    default: 'ASAP'
  },
  estimatedArrivalTime: {
    type: Date,
    default: null
  },
  isQueued: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    default: '',
  },
  isReviewed: {
    type: Boolean,
    default: false
  },
  finalQuote: {
    type: Number,
    default: null
  },
  quoteReason: {
    type: String,
    default: null
  },
  quotePhoto: {
    type: String,
    default: null
  },
  quoteApproved: {
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
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'upi', 'mock'],
    default: 'mock'
  },
  transactionId: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    default: 0
  },
  areaType: {
    type: String,
    enum: ['campus', 'nearby', 'far'],
    default: 'nearby'
  },
  transportCharge: {
    type: Number,
    default: 50
  },
  transportOption: {
    type: String,
    enum: ['shop', 'doorstep'],
    default: 'doorstep'
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
