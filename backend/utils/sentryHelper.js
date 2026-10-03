// backend/utils/sentryHelper.js
// Sentry PII scrubbing utilities for Fixvo backend.
// Called in Sentry.init beforeSend / beforeSendTransaction hooks.
// Ensures passwords, tokens, payment credentials, Aadhaar/PAN,
// bank details, phone numbers, and precise GPS are NEVER sent to Sentry.

// ─── Fields to fully redact ──────────────────────────────────────────────────

const REDACTED_FIELDS = new Set([
  // Auth & session secrets
  'password', 'confirmPassword', 'currentPassword', 'newPassword',
  'token', 'accessToken', 'authToken', 'jwtToken', 'refreshToken',
  'WA_ACCESS_TOKEN', 'RAZORPAY_KEY_SECRET', 'JWT_SECRET', 'KYC_ENCRYPTION_KEY',
  'adminSecret', 'recoveryKey',

  // Payment credentials
  'razorpay_signature', 'razorpay_payment_id', 'razorpay_key_secret',
  'cardNumber', 'cvv', 'expiryDate', 'stripeSecret', 'client_secret',

  // Indian government-issued IDs
  'aadhaarNumber', 'panNumber', 'aadhaar', 'pan',

  // Bank details
  'accountNumber', 'ifscCode', 'bankAccount', 'routingNumber',

  // Contact PII — phone numbers only (email kept for error context)
  'phone', 'phoneNumber', 'mobile', 'mobileNumber',

  // Precise GPS (latitude + longitude together enable location tracking)
  'latitude', 'longitude', 'lat', 'lng',
  'lastTechLat', 'lastTechLng',

  // WhatsApp-specific
  'rawPhone', 'e164Phone'
]);

const REDACTED_PLACEHOLDER = '[REDACTED]';

// ─── Recursive scrubber ───────────────────────────────────────────────────────

/**
 * Deeply traverse any object/array and redact matching keys.
 * Returns a new object — does not mutate the input.
 *
 * @param {*} data - Any value (object, array, string, etc.)
 * @param {number} [depth=0] - Current recursion depth (guard against deep structures)
 * @returns {*} Scrubbed copy
 */
function scrubValue(data, depth = 0) {
  if (depth > 10) return data; // Safety: don't recurse indefinitely
  if (data === null || data === undefined) return data;
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') return data;

  if (Array.isArray(data)) {
    return data.map(item => scrubValue(item, depth + 1));
  }

  if (typeof data === 'object') {
    const scrubbed = {};
    for (const [key, value] of Object.entries(data)) {
      if (REDACTED_FIELDS.has(key)) {
        scrubbed[key] = REDACTED_PLACEHOLDER;
      } else {
        scrubbed[key] = scrubValue(value, depth + 1);
      }
    }
    return scrubbed;
  }

  return data;
}

// ─── Sentry event scrubber ────────────────────────────────────────────────────

/**
 * Sentry `beforeSend` and `beforeSendTransaction` hook.
 * Scrubs PII from the Sentry event before it is transmitted.
 *
 * @param {object} event - Sentry event object
 * @returns {object|null} Scrubbed event, or null to drop the event
 */
function scrubSentryEvent(event) {
  if (!event) return event;

  try {
    // Scrub request body (most common PII location)
    if (event.request) {
      if (event.request.data) {
        event.request.data = scrubValue(event.request.data);
      }
      // Never send query strings (may contain tokens in GET requests)
      if (event.request.query_string) {
        event.request.query_string = '[REDACTED]';
      }
      // Strip cookies entirely
      if (event.request.cookies) {
        event.request.cookies = '[REDACTED]';
      }
      // Strip Authorization header
      if (event.request.headers) {
        if (event.request.headers['Authorization']) {
          event.request.headers['Authorization'] = '[REDACTED]';
        }
        if (event.request.headers['authorization']) {
          event.request.headers['authorization'] = '[REDACTED]';
        }
        if (event.request.headers['x-hub-signature-256']) {
          event.request.headers['x-hub-signature-256'] = '[REDACTED]';
        }
        if (event.request.headers['x-razorpay-signature']) {
          event.request.headers['x-razorpay-signature'] = '[REDACTED]';
        }
      }
    }

    // Scrub extra context
    if (event.extra) {
      event.extra = scrubValue(event.extra);
    }

    // Scrub breadcrumbs (can contain logged request data)
    if (event.breadcrumbs && Array.isArray(event.breadcrumbs.values)) {
      event.breadcrumbs.values = event.breadcrumbs.values.map(crumb => {
        if (crumb.data) {
          crumb.data = scrubValue(crumb.data);
        }
        return crumb;
      });
    }

    // Scrub user context — keep id but redact ip and username if set
    if (event.user) {
      const { id, ...rest } = event.user;
      event.user = { id }; // Only keep the internal userId
    }

    return event;
  } catch (scrubErr) {
    // If scrubbing itself fails, drop the event to be safe
    console.error('[SentryHelper] Scrubbing failed, dropping event:', scrubErr.message);
    return null;
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  scrubSentryEvent,
  scrubValue,
  REDACTED_FIELDS,
  REDACTED_PLACEHOLDER
};
