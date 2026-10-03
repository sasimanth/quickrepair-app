// backend/services/WhatsAppService.js
// Meta WhatsApp Business Cloud API integration.
// Handles phone normalization, template dispatch, PII-safe logging, and deduplication.

const crypto = require('crypto');
const WhatsAppLog = require('../models/WhatsAppLog');

// ─── Constants ───────────────────────────────────────────────────────────────

const WA_API_BASE = 'https://graph.facebook.com';
const DEDUP_WINDOW_MS = 60 * 1000; // 60 seconds — prevent duplicate messages

// ─── Phone Normalization ─────────────────────────────────────────────────────

/**
 * Normalize any Indian phone number format to E.164 (+91XXXXXXXXXX).
 * Required by Meta's WhatsApp Cloud API.
 *
 * @param {string|number} phone - Raw phone number
 * @returns {string} E.164 formatted phone number
 * @throws {Error} If the number is invalid or cannot be normalized
 */
function normalizeToE164(phone) {
  if (!phone) throw new Error('Phone number is required');

  // Strip all non-digit characters
  const digits = String(phone).replace(/\D/g, '');

  if (!digits || digits.length === 0) {
    throw new Error('Phone number contains no digits');
  }

  // Already 12 digits starting with 91 (e.g. 919876543210)
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  // 10 digit Indian number (e.g. 9876543210)
  if (digits.length === 10) {
    // Basic sanity: first digit must be 6–9 for Indian mobile numbers
    if (!/^[6-9]/.test(digits)) {
      throw new Error(`Invalid Indian mobile number: ${digits}`);
    }
    return `+91${digits}`;
  }

  // 11 digits starting with 0 (e.g. 09876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.slice(1)}`;
  }

  // Already has + prefix
  if (phone.toString().trim().startsWith('+') && digits.length >= 11) {
    return `+${digits}`;
  }

  throw new Error(
    `Cannot normalize phone number "${phone}" to E.164 — unexpected format (${digits.length} digits)`
  );
}

// ─── PII-Safe Phone Hash ─────────────────────────────────────────────────────

/**
 * One-way SHA-256 hash of an E.164 phone number for PII-safe storage.
 * @param {string} e164Phone
 * @returns {string} 64-character hex hash
 */
function hashPhone(e164Phone) {
  return crypto.createHash('sha256').update(e164Phone).digest('hex');
}

/**
 * Returns last 4 digits of E.164 number for safe log display.
 * Example: +919876543210 → '****3210'
 */
function maskPhone(e164Phone) {
  if (!e164Phone || e164Phone.length < 4) return '****';
  return `****${e164Phone.slice(-4)}`;
}

// ─── Template Payload Builder ────────────────────────────────────────────────

/**
 * Build the Meta Graph API message payload for a template message.
 *
 * @param {string} to - E.164 recipient phone number
 * @param {string} templateName - Approved template name from Meta Business Manager
 * @param {string[]} variables - Ordered list of body variable values ({{1}}, {{2}}, ...)
 * @param {string} [language='en'] - BCP-47 language code
 * @returns {object} JSON body for POST to Messages API
 */
function buildTemplatePayload(to, templateName, variables = [], language = 'en') {
  if (!to) throw new Error('Recipient phone number (to) is required');
  if (!templateName) throw new Error('Template name is required');

  const bodyComponents = [];

  if (variables.length > 0) {
    bodyComponents.push({
      type: 'body',
      parameters: variables.map((value) => ({
        type: 'text',
        text: value === undefined ? '' : String(value)
      }))
    });
  }

  return {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components: bodyComponents
    }
  };
}

// ─── Deduplication Check ─────────────────────────────────────────────────────

/**
 * Returns true if an identical message (same userId + templateName + bookingId)
 * was already dispatched within the deduplication window.
 */
async function isDuplicate(userId, templateName, bookingId) {
  const since = new Date(Date.now() - DEDUP_WINDOW_MS);
  const existing = await WhatsAppLog.findOne({
    userId,
    templateName,
    bookingId: bookingId || null,
    createdAt: { $gte: since },
    status: { $in: ['pending', 'sent', 'delivered', 'read'] }
  });
  return !!existing;
}

// ─── Core Sender ─────────────────────────────────────────────────────────────

/**
 * Send an approved WhatsApp template message via Meta's Cloud API.
 *
 * Design principles:
 * - Never throws — returns { success, wamid, error } instead
 * - Logs to WhatsAppLog BEFORE the API call (status: pending) to prevent races
 * - Updates log with wamid on success or error details on failure
 * - PII-safe: only phoneHash is stored, never raw phone
 *
 * @param {string} userId - Fixvo user ID (for logging + deduplication)
 * @param {string} rawPhone - Raw phone number (any format)
 * @param {string} templateName - Approved template name
 * @param {string[]} variables - Template body variable values
 * @param {string|null} bookingId - For deduplication + log linking
 * @returns {Promise<{success: boolean, wamid?: string, error?: string}>}
 */
async function sendWhatsAppTemplate(userId, rawPhone, templateName, variables = [], bookingId = null) {
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const accessToken = process.env.WA_ACCESS_TOKEN;
  const apiVersion = process.env.WA_API_VERSION || 'v19.0';

  // Guard: credentials not configured → mock/log mode
  if (!phoneNumberId || !accessToken) {
    console.warn(
      `[WhatsApp] Credentials not configured (WA_PHONE_NUMBER_ID or WA_ACCESS_TOKEN missing). ` +
      `Would send template "${templateName}" to ${maskPhone(rawPhone)}`
    );
    return { success: false, error: 'WhatsApp credentials not configured' };
  }

  // Normalize phone
  let e164Phone;
  try {
    e164Phone = normalizeToE164(rawPhone);
  } catch (normErr) {
    console.error(`[WhatsApp] Phone normalization failed for user ${userId}:`, normErr.message);
    return { success: false, error: normErr.message };
  }

  // Deduplication check
  try {
    if (await isDuplicate(userId, templateName, bookingId)) {
      console.log(
        `[WhatsApp] Duplicate suppressed — template "${templateName}" already sent to ` +
        `${maskPhone(e164Phone)} within the last ${DEDUP_WINDOW_MS / 1000}s`
      );
      return { success: false, error: 'Duplicate suppressed' };
    }
  } catch (dedupErr) {
    // Non-fatal: log and continue
    console.error('[WhatsApp] Deduplication check failed (continuing):', dedupErr.message);
  }

  // Create log entry with status 'pending' (before API call)
  let logEntry;
  try {
    logEntry = await WhatsAppLog.create({
      userId,
      bookingId,
      templateName,
      phoneHash: hashPhone(e164Phone),
      status: 'pending'
    });
  } catch (logErr) {
    console.error('[WhatsApp] Failed to create log entry (continuing):', logErr.message);
    // Continue even if logging fails — don't block the send
  }

  // Build and send the API request
  const payload = buildTemplatePayload(e164Phone, templateName, variables);
  const url = `${WA_API_BASE}/${apiVersion}/${phoneNumberId}/messages`;

  let wamid = null;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // SECURITY: Token intentionally not logged anywhere in this function
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      const errCode = result?.error?.code;
      const errMsg = result?.error?.message || `HTTP ${response.status}`;
      console.error(
        `[WhatsApp] API error for template "${templateName}" to ${maskPhone(e164Phone)} — ` +
        `code: ${errCode}, message: ${errMsg}`
      );

      if (logEntry) {
        await WhatsAppLog.updateOne(
          { _id: logEntry._id },
          { status: 'failed', errorCode: errCode || null, errorMessage: errMsg, statusUpdatedAt: new Date() }
        );
      }
      return { success: false, error: errMsg, errorCode: errCode };
    }

    wamid = result?.messages?.[0]?.id;
    console.log(
      `[WhatsApp] ✅ Sent template "${templateName}" to ${maskPhone(e164Phone)} — wamid: ${wamid}`
    );

    if (logEntry) {
      await WhatsAppLog.updateOne(
        { _id: logEntry._id },
        { wamid, status: 'sent', statusUpdatedAt: new Date() }
      );
    }

    return { success: true, wamid };

  } catch (networkErr) {
    console.error(
      `[WhatsApp] Network error for template "${templateName}" to ${maskPhone(e164Phone)}:`,
      networkErr.message
    );

    if (logEntry) {
      await WhatsAppLog.updateOne(
        { _id: logEntry._id },
        { status: 'failed', errorMessage: networkErr.message, statusUpdatedAt: new Date() }
      );
    }

    return { success: false, error: networkErr.message };
  }
}

// ─── Delivery Status Update (called by webhook handler) ──────────────────────

/**
 * Update WhatsAppLog when Meta sends a delivery status webhook event.
 * Maps Meta status strings to our enum values.
 *
 * @param {string} wamid - WhatsApp message ID
 * @param {string} status - Meta status: 'sent' | 'delivered' | 'read' | 'failed'
 * @param {{ code: number, message: string }|null} error - Error details for 'failed' status
 */
async function updateDeliveryStatus(wamid, status, error = null) {
  if (!wamid) return;

  // Map Meta statuses to our enum
  const statusMap = { sent: 'sent', delivered: 'delivered', read: 'read', failed: 'failed' };
  const mappedStatus = statusMap[status] || null;
  if (!mappedStatus) {
    console.warn(`[WhatsApp] Unknown status update: "${status}" for wamid: ${wamid}`);
    return;
  }

  try {
    const update = { status: mappedStatus, statusUpdatedAt: new Date() };
    if (error) {
      update.errorCode = error.code || null;
      update.errorMessage = error.message || null;
    }

    await WhatsAppLog.updateOne({ wamid }, { $set: update });
    console.log(`[WhatsApp] Status updated: wamid ${wamid} → ${mappedStatus}`);
  } catch (err) {
    console.error('[WhatsApp] Failed to update delivery status:', err.message);
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  normalizeToE164,
  hashPhone,
  maskPhone,
  buildTemplatePayload,
  sendWhatsAppTemplate,
  updateDeliveryStatus
};
