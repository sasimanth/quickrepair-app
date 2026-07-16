const mongoose = require('mongoose');

const securityAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userEmail: {
    type: String
  },
  alertType: {
    type: String,
    required: true // e.g., 'FAILED_LOGIN_LOCKOUT', 'SUSPICIOUS_SIGNUP', 'RATE_LIMIT_VIOLATION', 'PAYMENT_ANOMALY', 'CANCELLATION_ABUSE', 'WITHDRAWAL_RISK'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolutionNotes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('SecurityAlert', securityAlertSchema);
