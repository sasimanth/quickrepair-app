// backend/controllers/whatsappController.js
// Meta WhatsApp Business Cloud API — webhook handler and opt-in/opt-out controller.
// Replaces the legacy Twilio TwiML stub.

const crypto = require('crypto');
const User = require('../models/User');
const { updateDeliveryStatus } = require('../services/WhatsAppService');

// ─── Webhook: GET (Meta Verification Challenge) ──────────────────────────────

/**
 * Meta sends a GET request to verify the webhook URL.
 * We must respond with hub.challenge if hub.verify_token matches.
 *
 * Docs: https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (!mode || !token) {
    return res.status(400).json({ message: 'Missing hub.mode or hub.verify_token' });
  }

  if (mode === 'subscribe' && token === process.env.WA_WEBHOOK_VERIFY_TOKEN) {
    console.log('[WhatsApp] Webhook verified by Meta ✅');
    return res.status(200).send(challenge);
  }

  console.warn('[WhatsApp] Webhook verification failed — invalid verify token');
  return res.status(403).json({ message: 'Forbidden: invalid verify token' });
};

// ─── Webhook: POST (Incoming Events) ─────────────────────────────────────────

/**
 * Verify the X-Hub-Signature-256 header using HMAC-SHA256 over the raw body.
 * Uses timing-safe comparison to prevent timing oracle attacks.
 *
 * @returns {boolean}
 */
function isSignatureValid(req) {
  const secret = process.env.WA_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[WhatsApp] WA_WEBHOOK_SECRET not set — skipping signature verification in dev mode');
    return process.env.NODE_ENV !== 'production';
  }

  const signatureHeader = req.headers['x-hub-signature-256'];
  if (!signatureHeader) return false;

  const rawBody = req.rawBody;
  if (!rawBody) return false;

  const expected = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')}`;

  // Timing-safe comparison — same pattern as Razorpay webhook
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader, 'utf8'),
      Buffer.from(expected, 'utf8')
    );
  } catch {
    return false;
  }
}

/**
 * Handle incoming Meta webhook POST events.
 * Meta expects a 200 response within 20 seconds — always respond 200 quickly,
 * then process async.
 */
const handleWebhookEvent = async (req, res) => {
  // 1. Signature verification
  if (!isSignatureValid(req)) {
    console.warn('[WhatsApp] Invalid webhook signature — rejecting request');
    return res.status(401).json({ message: 'Invalid signature' });
  }

  // 2. Respond immediately (Meta will retry if we take > 20s)
  res.status(200).json({ status: 'ok' });

  // 3. Process event asynchronously
  try {
    const body = req.rawBody ? JSON.parse(req.rawBody.toString('utf8')) : req.body;

    if (!body || body.object !== 'whatsapp_business_account') {
      return; // Not a WA event — ignore silently
    }

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value || {};

        // ── Delivery status updates ──────────────────────────────────────────
        const statuses = value.statuses || [];
        for (const statusEvent of statuses) {
          const { id: wamid, status, errors } = statusEvent;
          const error = errors?.[0]
            ? { code: errors[0].code, message: errors[0].message }
            : null;

          await updateDeliveryStatus(wamid, status, error).catch((err) =>
            console.error('[WhatsApp] Status update error:', err.message)
          );
        }

        // ── Incoming messages (log only, no bot replies in Phase 7) ──────────
        const messages = value.messages || [];
        for (const msg of messages) {
          const fromMasked = msg.from ? `****${msg.from.slice(-4)}` : 'unknown';
          const msgType = msg.type || 'unknown';
          console.log(
            `[WhatsApp] Incoming ${msgType} message from ${fromMasked} — id: ${msg.id}`
          );
          // Future: implement incoming message handler (customer replies, opt-out keywords)
        }
      }
    }
  } catch (parseErr) {
    console.error('[WhatsApp] Failed to parse webhook event:', parseErr.message);
  }
};

// ─── Opt-In Controller ────────────────────────────────────────────────────────

// Current consent text version — increment when copy changes
const WHATSAPP_CONSENT_VERSION = '1.0';

/**
 * POST /api/whatsapp/optin
 * Authenticated user explicitly opts in to WhatsApp notifications.
 * Records timestamp and consent version for DPDPA 2023 compliance audit trail.
 */
const optIn = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select('phone notificationPreferences');

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.phone) {
      return res.status(400).json({
        message: 'A verified phone number is required to opt in to WhatsApp notifications. Please add your phone number in Settings first.'
      });
    }

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          'notificationPreferences.whatsappEnabled': true,
          'notificationPreferences.whatsappOptInAt': new Date(),
          'notificationPreferences.whatsappOptInVersion': WHATSAPP_CONSENT_VERSION
        }
      }
    );

    console.log(`[WhatsApp] User ${userId} opted IN to WhatsApp notifications`);

    return res.json({
      success: true,
      message: 'WhatsApp notifications enabled. You will receive booking updates on your registered number.',
      whatsappEnabled: true
    });
  } catch (err) {
    console.error('[WhatsApp] Opt-in error:', err.message);
    return res.status(500).json({ message: 'Failed to update WhatsApp preference' });
  }
};

// ─── Opt-Out Controller ───────────────────────────────────────────────────────

/**
 * POST /api/whatsapp/optout
 * Authenticated user opts out. Clears whatsappEnabled, records optout timestamp.
 */
const optOut = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          'notificationPreferences.whatsappEnabled': false,
          'notificationPreferences.whatsappOptOutAt': new Date()
        }
      }
    );

    console.log(`[WhatsApp] User ${userId} opted OUT of WhatsApp notifications`);

    return res.json({
      success: true,
      message: 'WhatsApp notifications disabled. You will no longer receive booking updates via WhatsApp.',
      whatsappEnabled: false
    });
  } catch (err) {
    console.error('[WhatsApp] Opt-out error:', err.message);
    return res.status(500).json({ message: 'Failed to update WhatsApp preference' });
  }
};

// ─── Status Controller ────────────────────────────────────────────────────────

/**
 * GET /api/whatsapp/status
 * Returns the current WhatsApp opt-in state for the authenticated user.
 */
const getStatus = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId)
      .select('phone notificationPreferences')
      .lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    const prefs = user.notificationPreferences || {};
    return res.json({
      success: true,
      hasPhone: !!user.phone,
      whatsappEnabled: prefs.whatsappEnabled || false,
      whatsappOptInAt: prefs.whatsappOptInAt || null,
      whatsappOptOutAt: prefs.whatsappOptOutAt || null
    });
  } catch (err) {
    console.error('[WhatsApp] Status check error:', err.message);
    return res.status(500).json({ message: 'Failed to fetch WhatsApp status' });
  }
};

module.exports = {
  verifyWebhook,
  handleWebhookEvent,
  optIn,
  optOut,
  getStatus,
  // Export for testing
  isSignatureValid
};
