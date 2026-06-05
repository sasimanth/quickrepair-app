const mongoose = require('mongoose');

const payoutLogSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  technicianId: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  techShare: {
    type: Number,
    required: true
  },
  platformFee: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'cash'
  },
  gatewayStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  transactionId: {
    type: String,
    default: null
  },
  transferStatus: {
    type: String,
    enum: ['logged', 'settled', 'failed'],
    default: 'logged'
  },
  transferDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

payoutLogSchema.index({ bookingId: 1 });
payoutLogSchema.index({ technicianId: 1 });
payoutLogSchema.index({ transferStatus: 1 });

module.exports = mongoose.model('PayoutLog', payoutLogSchema);
