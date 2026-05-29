const mongoose = require('mongoose');

const legalDocumentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['privacy_policy', 'terms_conditions', 'refund_policy', 'cancellation_policy', 'technician_terms', 'user_agreement'],
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  updatedBy: {
    type: String, // Admin user ID
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('LegalDocument', legalDocumentSchema);
