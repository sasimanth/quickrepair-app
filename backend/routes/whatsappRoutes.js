// backend/routes/whatsappRoutes.js
// Meta WhatsApp Business Cloud API routes.
// Replaces the legacy Twilio TwiML stub.

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { whatsappWebhookLimiter, whatsappOptInLimiter } = require('../middleware/rateLimiter');
const rawWhatsAppBody = require('../middleware/rawWhatsAppBody');
const {
  verifyWebhook,
  handleWebhookEvent,
  optIn,
  optOut,
  getStatus
} = require('../controllers/whatsappController');

// ── Webhook: Meta verification challenge (GET) ────────────────────────────────
// Unauthenticated — called by Meta infrastructure to verify endpoint ownership.
router.get('/webhook', whatsappWebhookLimiter, verifyWebhook);

// ── Webhook: Incoming events from Meta (POST) ─────────────────────────────────
// rawWhatsAppBody must run BEFORE express.json() on this route.
// Mounted on server.js with a specific raw-body intercept (see server.js).
router.post('/webhook', whatsappWebhookLimiter, handleWebhookEvent);

// ── Opt-In (authenticated users only) ────────────────────────────────────────
// POST /api/whatsapp/optin
router.post('/optin', protect, whatsappOptInLimiter, optIn);

// ── Opt-Out (authenticated users only) ───────────────────────────────────────
// POST /api/whatsapp/optout
router.post('/optout', protect, optOut);

// ── Status check (authenticated users only) ───────────────────────────────────
// GET /api/whatsapp/status
router.get('/status', protect, getStatus);

module.exports = router;
