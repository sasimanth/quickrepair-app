const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminName: {
    type: String,
    required: true
  },
  adminEmail: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true // e.g., 'APPROVE_TECHNICIAN', 'REJECT_TECHNICIAN', 'APPROVE_WITHDRAWAL', 'REJECT_WITHDRAWAL', 'MARK_PAID_WITHDRAWAL'
  },
  targetId: {
    type: String
  },
  targetType: {
    type: String // e.g., 'Technician', 'WithdrawalRequest', 'Booking', 'User'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
