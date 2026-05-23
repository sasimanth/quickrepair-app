const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  technicianId: {
    type: String, // Keep as String to support UUID/Mongoose string representations from auth
    required: true,
    ref: 'User'
  },
  amount: {
    type: Number,
    required: true
  },
  bankDetails: {
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    upiId: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  transactionId: {
    type: String,
    default: ''
  },
  processedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
