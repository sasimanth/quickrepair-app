// backend/models/RazorpayEvent.js
const mongoose = require('mongoose');

const RazorpayEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true }, // Razorpay event ID
  eventType: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
  rawPayload: { type: mongoose.Schema.Types.Mixed }, // optional raw payload for audit
}, { timestamps: true });

module.exports = mongoose.model('RazorpayEvent', RazorpayEventSchema);
