// frontend/src/utils/analytics.js
// Mixpanel product analytics wrapper for Fixvo.
//
// Privacy rules:
//   1. All user IDs are MongoDB internal _id strings — never email, phone, or name.
//   2. All event properties pass through sanitizeProperties() before dispatch.
//   3. A localStorage opt-out flag is checked at every track/identify call.
//   4. Amounts are sent as bracket ranges (e.g. "500-999"), never exact figures.
//   5. This module never throws — analytics must never break app flows.
//
// Usage:
//   import { track, identify, optOut, optIn } from '../utils/analytics';
//   track('booking_submitted', { serviceCategory: 'AC Repair', paymentMethod: 'razorpay' });
//   identify(user._id);   // call on login/signup

import mixpanel from 'mixpanel-browser';

// ─── Configuration ────────────────────────────────────────────────────────────

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;
const OPT_OUT_KEY = 'fixvo_analytics_opt_out';
const IS_DEV = import.meta.env.MODE === 'development';
const IS_TEST = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

// ─── Fields to strip from every event (defence-in-depth) ─────────────────────

const PII_FIELDS = new Set([
  'email', 'phone', 'phoneNumber', 'mobile',
  'password', 'confirmPassword', 'token', 'accessToken', 'authToken',
  'name', 'fullName', 'customerName', 'technicianName',
  'address', 'street', 'houseNumber',
  'latitude', 'longitude', 'lat', 'lng',
  'aadhaarNumber', 'panNumber', 'accountNumber', 'ifscCode',
  'cardNumber', 'cvv', 'expiryDate',
  'razorpay_signature', 'razorpay_payment_id'
]);

// ─── Initialise ───────────────────────────────────────────────────────────────

let _initialized = false;

function ensureInitialized() {
  if (_initialized || !MIXPANEL_TOKEN || IS_TEST) return;
  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: IS_DEV,
      track_pageview: false,    // We track page views manually for precision
      persistence: 'localStorage',
      opt_out_tracking_by_default: false,
      ip: false,                // Do not collect IP address
      property_blacklist: [     // Server-side strip of common PII
        '$email', '$phone', '$name', '$username'
      ]
    });
    _initialized = true;
  } catch (err) {
    if (IS_DEV) console.warn('[Analytics] Mixpanel init failed:', err.message);
  }
}

// ─── Opt-out check ────────────────────────────────────────────────────────────

export function isOptedOut() {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === 'true';
  } catch {
    return true; // Fail-safe: treat storage error as opted-out
  }
}

// ─── PII sanitiser ────────────────────────────────────────────────────────────

/**
 * Remove any PII fields from event properties before sending to Mixpanel.
 * Returns a new object — never mutates the input.
 *
 * @param {object} props - Raw event properties
 * @returns {object} Sanitised copy
 */
export function sanitizeProperties(props = {}) {
  const safe = {};
  for (const [key, value] of Object.entries(props)) {
    if (PII_FIELDS.has(key)) continue; // Drop entirely
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      safe[key] = value;
    } else if (value === null || value === undefined) {
      safe[key] = value;
    }
    // Skip nested objects/arrays — they may contain PII we can't predict
  }
  return safe;
}

// ─── Amount → bracket conversion ─────────────────────────────────────────────

/**
 * Convert an exact rupee amount to a privacy-safe bracket string.
 * Prevents financial PII inference from analytics.
 *
 * @param {number} amount - Amount in INR
 * @returns {string} e.g. "500-999", "1000-1999", "5000+"
 */
export function amountBracket(amount) {
  if (!amount || typeof amount !== 'number') return 'unknown';
  if (amount < 200)   return '0-199';
  if (amount < 500)   return '200-499';
  if (amount < 1000)  return '500-999';
  if (amount < 2000)  return '1000-1999';
  if (amount < 5000)  return '2000-4999';
  return '5000+';
}

// ─── Core tracking API ────────────────────────────────────────────────────────

/**
 * Track an analytics event. Silently no-ops when:
 *   - User has opted out
 *   - Token is not configured
 *   - Running in test mode
 *   - Mixpanel throws internally
 *
 * @param {string} eventName - Snake_case event name (e.g. 'booking_completed')
 * @param {object} [properties] - Safe scalar properties only
 */
export function track(eventName, properties = {}) {
  if (isOptedOut() || !MIXPANEL_TOKEN || IS_TEST) return;
  ensureInitialized();
  try {
    const safe = sanitizeProperties(properties);
    mixpanel.track(eventName, safe);
  } catch (err) {
    if (IS_DEV) console.warn('[Analytics] track() failed:', err.message);
  }
}

/**
 * Associate all future events with a user identity.
 * Only passes the internal Fixvo userId — never email or phone.
 *
 * Call immediately after login or signup confirmation.
 *
 * @param {string} userId - MongoDB _id string
 */
export function identify(userId) {
  if (isOptedOut() || !MIXPANEL_TOKEN || !userId || IS_TEST) return;
  ensureInitialized();
  try {
    mixpanel.identify(userId);
  } catch (err) {
    if (IS_DEV) console.warn('[Analytics] identify() failed:', err.message);
  }
}

/**
 * Set persistent properties on the Mixpanel profile.
 * Only safe scalar values — never PII.
 *
 * @param {object} props - e.g. { role: 'technician', plan: 'free' }
 */
export function setPeople(props = {}) {
  if (isOptedOut() || !MIXPANEL_TOKEN || IS_TEST) return;
  ensureInitialized();
  try {
    const safe = sanitizeProperties(props);
    mixpanel.people.set(safe);
  } catch (err) {
    if (IS_DEV) console.warn('[Analytics] setPeople() failed:', err.message);
  }
}

// ─── Consent management ───────────────────────────────────────────────────────

/**
 * Opt the user out of analytics tracking permanently (until optIn() is called).
 * Stores the preference in localStorage.
 * Also calls mixpanel.opt_out_tracking() to stop any pending queued events.
 */
export function optOut() {
  try {
    localStorage.setItem(OPT_OUT_KEY, 'true');
  } catch { /* storage error — best effort */ }
  try {
    if (_initialized) mixpanel.opt_out_tracking();
    track('analytics_opted_out'); // Track final event before silencing
  } catch { /* no-op */ }
}

/**
 * Opt the user back in to analytics tracking.
 * Removes the localStorage flag and re-enables mixpanel.
 */
export function optIn() {
  try {
    localStorage.removeItem(OPT_OUT_KEY);
  } catch { /* storage error — best effort */ }
  try {
    if (_initialized) mixpanel.opt_in_tracking();
    track('analytics_opted_in');
  } catch { /* no-op */ }
}

// ─── Typed event helpers ──────────────────────────────────────────────────────
// These helpers enforce the correct property shape for each event type,
// preventing accidental PII leakage through wrong property names.

export const Analytics = {
  signupCompleted: ({ role, method }) =>
    track('signup_completed', { role, method }),

  loginCompleted: ({ role, method }) =>
    track('login_completed', { role, method }),

  serviceViewed: ({ serviceCategory }) =>
    track('service_viewed', { serviceCategory }),

  bookingStarted: ({ serviceCategory, serviceOption }) =>
    track('booking_started', { serviceCategory, serviceOption }),

  bookingSubmitted: ({ serviceCategory, serviceOption, paymentMethod }) =>
    track('booking_submitted', { serviceCategory, serviceOption, paymentMethod }),

  bookingCompleted: ({ serviceCategory, paymentMethod }) =>
    track('booking_completed', { serviceCategory, paymentMethod }),

  bookingCancelled: ({ serviceCategory, cancelledBy, reason }) =>
    track('booking_cancelled', { serviceCategory, cancelledBy, reason }),

  paymentInitiated: ({ method, amount }) =>
    track('payment_initiated', { method, amountBracket: amountBracket(amount) }),

  paymentCompleted: ({ method, amount }) =>
    track('payment_completed', { method, amountBracket: amountBracket(amount) }),

  paymentFailed: ({ method, errorCode }) =>
    track('payment_failed', { method, errorCode }),

  technicianAssigned: ({ serviceCategory }) =>
    track('technician_assigned', { serviceCategory })
};
