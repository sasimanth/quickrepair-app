const mongoose = require('mongoose');

const legalAcceptanceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  documentType: {
    type: String,
    enum: ['privacy_policy', 'terms_conditions', 'refund_policy', 'cancellation_policy', 'technician_terms', 'user_agreement'],
    required: true
  },
  version: {
    type: Number,
    required: true
  },
  acceptedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure a user only logs one acceptance record per document version
legalAcceptanceSchema.index({ userId: 1, documentType: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('LegalAcceptance', legalAcceptanceSchema);
