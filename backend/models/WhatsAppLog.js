const mongoose = require('mongoose');

/**
 * WhatsAppLog — PII-safe delivery tracking for every outbound WhatsApp message.
 *
 * SECURITY: Raw phone numbers are NEVER stored.
 * Only a SHA-256 hash of the E.164 number is persisted for deduplication.
 */
const whatsAppLogSchema = new mongoose.Schema(
  {
    // Unique WA message ID returned by Meta's Graph API (wamid.xxx)
    wamid: {
      type: String,
      sparse: true,  // null until Meta confirms send
      unique: true
    },

    // Fixvo internal IDs
    userId: { type: String, required: true },
    bookingId: { type: String, default: null },

    // Which approved template was used
    templateName: { type: String, required: true },

    // SHA-256 hex hash of the E.164 phone number — NOT raw PII
    phoneHash: { type: String, required: true },

    // Delivery lifecycle from Meta status webhooks
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
      default: 'pending'
    },
    statusUpdatedAt: { type: Date, default: null },

    // Meta error codes on failure (https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes)
    errorCode: { type: Number, default: null },
    errorMessage: { type: String, default: null }
  },
  { timestamps: true }
);

// Index for deduplication queries (userId + templateName + bookingId)
whatsAppLogSchema.index({ userId: 1, templateName: 1, bookingId: 1, createdAt: -1 });

// Index for status webhook lookups by wamid
whatsAppLogSchema.index({ wamid: 1 });

// TTL index: auto-delete logs older than 90 days to limit PII exposure window
whatsAppLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('WhatsAppLog', whatsAppLogSchema);
