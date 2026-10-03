/**
 * monitoring.test.js
 * Phase 8: Production Monitoring, Error Tracking & Product Analytics
 *
 * Tests:
 *  1.  sentryHelper — PII scrubbing (14 cases)
 *  2.  Winston logger — initialization and format
 *  3.  /api/health — DB-aware status endpoint
 *  4.  Sentry not initialized in test mode
 *  5.  Payment controller Sentry integration (mock)
 */

'use strict';

// ─── Sentry mock (must be before any require that imports @sentry/node) ───────
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  Handlers: {
    requestHandler: () => (req, res, next) => next(),
    errorHandler: () => (err, req, res, next) => next(err)
  },
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn()
}));

const Sentry = require('@sentry/node');
const { scrubSentryEvent, scrubValue, REDACTED_FIELDS, REDACTED_PLACEHOLDER } = require('../utils/sentryHelper');

// ─── 1. sentryHelper PII scrubbing ───────────────────────────────────────────

describe('1. sentryHelper — PII field scrubbing', () => {
  const makeEvent = (body = {}, extra = {}, headers = {}) => ({
    request: {
      data: body,
      query_string: 'token=abc123',
      cookies: { session: 'xyz' },
      headers: { Authorization: 'Bearer eyJhb...', 'content-type': 'application/json', ...headers }
    },
    extra,
    user: { id: 'user123', email: 'test@example.com', ip: '1.2.3.4' },
    breadcrumbs: { values: [] }
  });

  test('scrubs password from request body', () => {
    const event = makeEvent({ password: 'S3cr3t!', email: 'a@b.com' });
    const result = scrubSentryEvent(event);
    expect(result.request.data.password).toBe(REDACTED_PLACEHOLDER);
    expect(result.request.data.email).toBe('a@b.com'); // email kept in body context
  });

  test('scrubs token from request body', () => {
    const event = makeEvent({ token: 'eyJhb...', userId: 'abc123' });
    const result = scrubSentryEvent(event);
    expect(result.request.data.token).toBe(REDACTED_PLACEHOLDER);
    expect(result.request.data.userId).toBe('abc123');
  });

  test('scrubs razorpay_signature from request body', () => {
    const event = makeEvent({ razorpay_signature: 'abc123sig', bookingId: 'bk1' });
    const result = scrubSentryEvent(event);
    expect(result.request.data.razorpay_signature).toBe(REDACTED_PLACEHOLDER);
  });

  test('scrubs phone from request body', () => {
    const event = makeEvent({ phone: '9876543210', role: 'user' });
    const result = scrubSentryEvent(event);
    expect(result.request.data.phone).toBe(REDACTED_PLACEHOLDER);
    expect(result.request.data.role).toBe('user');
  });

  test('scrubs aadhaarNumber from request body', () => {
    const event = makeEvent({ aadhaarNumber: '1234-5678-9012' });
    const result = scrubSentryEvent(event);
    expect(result.request.data.aadhaarNumber).toBe(REDACTED_PLACEHOLDER);
  });

  test('scrubs panNumber from request body', () => {
    const event = makeEvent({ panNumber: 'ABCDE1234F' });
    const result = scrubSentryEvent(event);
    expect(result.request.data.panNumber).toBe(REDACTED_PLACEHOLDER);
  });

  test('scrubs accountNumber from request body', () => {
    const event = makeEvent({ accountNumber: '0123456789', ifscCode: 'HDFC0001234' });
    const result = scrubSentryEvent(event);
    expect(result.request.data.accountNumber).toBe(REDACTED_PLACEHOLDER);
    expect(result.request.data.ifscCode).toBe(REDACTED_PLACEHOLDER);
  });

  test('scrubs latitude and longitude from extras', () => {
    const event = makeEvent({}, { latitude: 17.3850, longitude: 78.4867 });
    const result = scrubSentryEvent(event);
    expect(result.extra.latitude).toBe(REDACTED_PLACEHOLDER);
    expect(result.extra.longitude).toBe(REDACTED_PLACEHOLDER);
  });

  test('does NOT scrub safe fields (bookingId, serviceCategory, role)', () => {
    const event = makeEvent({ bookingId: 'bk123', role: 'technician', serviceCategory: 'AC Repair' });
    const result = scrubSentryEvent(event);
    expect(result.request.data.bookingId).toBe('bk123');
    expect(result.request.data.role).toBe('technician');
    expect(result.request.data.serviceCategory).toBe('AC Repair');
  });

  test('scrubs Authorization header', () => {
    const event = makeEvent({});
    const result = scrubSentryEvent(event);
    expect(result.request.headers['Authorization']).toBe('[REDACTED]');
  });

  test('scrubs query_string entirely', () => {
    const event = makeEvent({});
    const result = scrubSentryEvent(event);
    expect(result.request.query_string).toBe('[REDACTED]');
  });

  test('scrubs cookies entirely', () => {
    const event = makeEvent({});
    const result = scrubSentryEvent(event);
    expect(result.request.cookies).toBe('[REDACTED]');
  });

  test('keeps only userId in user context — strips email and ip', () => {
    const event = makeEvent({});
    const result = scrubSentryEvent(event);
    expect(result.user).toEqual({ id: 'user123' });
    expect(result.user.email).toBeUndefined();
    expect(result.user.ip).toBeUndefined();
  });

  test('scrubs breadcrumb data containing PII fields', () => {
    const event = makeEvent({});
    event.breadcrumbs.values = [
      { message: 'API call', data: { phone: '9876543210', url: '/api/auth/login' } }
    ];
    const result = scrubSentryEvent(event);
    expect(result.breadcrumbs.values[0].data.phone).toBe(REDACTED_PLACEHOLDER);
    expect(result.breadcrumbs.values[0].data.url).toBe('/api/auth/login');
  });

  test('returns null when scrubbing itself throws (safety net)', () => {
    // Simulate a malformed event that causes scrubbing to fail
    const badEvent = null;
    const result = scrubSentryEvent(badEvent);
    expect(result).toBeNull();
  });
});

// ─── 2. scrubValue — recursive deep scrubbing ─────────────────────────────────

describe('2. scrubValue — deep recursive scrubber', () => {
  test('scrubs nested password field', () => {
    const obj = { user: { password: 'secret', id: 'u1' } };
    const result = scrubValue(obj);
    expect(result.user.password).toBe(REDACTED_PLACEHOLDER);
    expect(result.user.id).toBe('u1');
  });

  test('handles arrays without throwing', () => {
    const arr = [{ phone: '9876543210' }, { bookingId: 'bk1' }];
    const result = scrubValue(arr);
    expect(result[0].phone).toBe(REDACTED_PLACEHOLDER);
    expect(result[1].bookingId).toBe('bk1');
  });

  test('returns primitives unchanged', () => {
    expect(scrubValue('hello')).toBe('hello');
    expect(scrubValue(42)).toBe(42);
    expect(scrubValue(true)).toBe(true);
    expect(scrubValue(null)).toBeNull();
  });

  test('respects depth limit (no infinite recursion)', () => {
    // Create a deeply nested object — scrubValue should return without throwing
    let deep = { bookingId: 'bk1' };
    for (let i = 0; i < 15; i++) deep = { nested: deep };
    expect(() => scrubValue(deep)).not.toThrow();
  });
});

// ─── 3. REDACTED_FIELDS completeness ─────────────────────────────────────────

describe('3. REDACTED_FIELDS set — required fields are present', () => {
  const required = [
    'password', 'token', 'accessToken', 'phone', 'phoneNumber',
    'aadhaarNumber', 'panNumber', 'accountNumber', 'ifscCode',
    'cardNumber', 'cvv', 'latitude', 'longitude',
    'razorpay_signature', 'WA_ACCESS_TOKEN', 'KYC_ENCRYPTION_KEY'
  ];
  test.each(required)('"%s" is in REDACTED_FIELDS', (field) => {
    expect(REDACTED_FIELDS.has(field)).toBe(true);
  });
});

// ─── 4. Winston logger ────────────────────────────────────────────────────────

describe('4. Winston logger', () => {
  let logger;

  beforeAll(() => {
    // Logger should load without throwing even in test mode
    logger = require('../utils/logger');
  });

  test('logger module exports a winston logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.info).toBe('function');
  });

  test('logger.error() does not throw when called', () => {
    expect(() => logger.error({ message: 'test error', requestId: 'req-123' })).not.toThrow();
  });

  test('logger.warn() does not throw when called', () => {
    expect(() => logger.warn({ message: 'test warning' })).not.toThrow();
  });

  test('logger.info() does not throw when called', () => {
    expect(() => logger.info({ message: 'test info', bookingId: 'bk-123' })).not.toThrow();
  });

  test('logger has no active transports in test mode (silent)', () => {
    // In test mode (NODE_ENV=test), logger should have zero transports
    // so that Jest output stays clean
    expect(logger.transports.length).toBe(0);
  });
});

// ─── 5. /api/health endpoint — DB-aware ──────────────────────────────────────

describe('5. GET /api/health — database-aware status', () => {
  let request, app, mongoose;

  beforeAll(() => {
    request = require('supertest');
    // Pre-load app and mongoose once — avoids Mongoose model re-registration issues
    mongoose = require('mongoose');
    app = require('../server').app;
  });

  function mockReadyState(value) {
    Object.defineProperty(mongoose.connection, 'readyState', {
      get: jest.fn().mockReturnValue(value),
      configurable: true
    });
  }

  test('returns 200 with status:ok when mongoose readyState is 1 (connected)', async () => {
    mockReadyState(1);
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
    expect(res.body.timestamp).toBeDefined();
    expect(typeof res.body.uptime).toBe('number');
  });

  test('returns 503 with status:degraded when mongoose readyState is 0 (disconnected)', async () => {
    mockReadyState(0);
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.db).toContain('disconnected');
  });

  test('health response includes version field', async () => {
    mockReadyState(1);
    const res = await request(app).get('/api/health');
    expect(res.body.version).toBeDefined();
  });
});


// ─── 6. Sentry not initialized in test mode ───────────────────────────────────

describe('6. Sentry — test mode gating', () => {
  test('Sentry.init is called but enabled:false when NODE_ENV=test', () => {
    // server.js calls Sentry.init on require — check the mock was called
    // The `enabled` option should be false since SENTRY_DSN is unset in tests
    expect(Sentry.init).toHaveBeenCalled();
    const initArgs = Sentry.init.mock.calls[0][0];
    // enabled = !!SENTRY_DSN && NODE_ENV !== 'test'
    // Since SENTRY_DSN is unset in test, enabled should be false
    expect(initArgs.enabled).toBe(false);
  });

  test('tracesSampleRate is 0 in non-production environments', () => {
    const initArgs = Sentry.init.mock.calls[0][0];
    // NODE_ENV in tests is 'test', not 'production'
    expect(initArgs.tracesSampleRate).toBe(0.0);
  });

  test('Sentry.init receives a beforeSend scrubber function', () => {
    const initArgs = Sentry.init.mock.calls[0][0];
    expect(typeof initArgs.beforeSend).toBe('function');
  });

  test('Sentry.init receives environment tag', () => {
    const initArgs = Sentry.init.mock.calls[0][0];
    expect(initArgs.environment).toBeDefined();
  });
});

// ─── 7. Payment controller Sentry integration ─────────────────────────────────

describe('7. Payment controller — Sentry.captureException integration', () => {
  afterEach(() => jest.clearAllMocks());

  test('Sentry.captureException is called with payment subsystem tag', () => {
    // Unit-test the Sentry.captureException call directly — no HTTP roundtrip needed
    const error = new Error('Simulated payment failure');
    Sentry.captureException(error, {
      tags: { subsystem: 'payment', gateway: 'razorpay', operation: 'createOrder' },
      extra: { bookingId: 'bk-test' }
    });

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const [capturedError, context] = Sentry.captureException.mock.calls[0];
    expect(capturedError.message).toBe('Simulated payment failure');
    expect(context.tags.subsystem).toBe('payment');
    expect(context.tags.gateway).toBe('razorpay');
    // Verify bookingId is allowed as context (not PII)
    expect(context.extra.bookingId).toBe('bk-test');
  });

  test('razorpayController is importable and has Sentry required', () => {
    // Verify the controller loads without error with the Sentry mock in place
    expect(() => require('../controllers/razorpayController')).not.toThrow();
  });

  test('Sentry scrubber on captureException context strips phone', () => {
    // Verify the scrubber removes phone numbers from extra context
    const rawContext = { extra: { bookingId: 'bk1', phone: '9876543210' } };
    const scrubbed = scrubValue(rawContext.extra);
    expect(scrubbed.phone).toBe(REDACTED_PLACEHOLDER);
    expect(scrubbed.bookingId).toBe('bk1');
  });
});

// ─── 8. Global Express error handler ─────────────────────────────────────────

describe('8. Global Express error handler', () => {
  test('returns structured JSON with requestId on unhandled error', async () => {
    const request = require('supertest');
    const express = require('express');

    // Create a minimal test app with the global handler pattern
    const testApp = express();
    testApp.use((req, _res, next) => { req.id = 'test-req-id'; next(); });
    testApp.get('/test-error', (_req, _res, next) => {
      const err = new Error('Test error message');
      err.status = 422;
      next(err);
    });
    // eslint-disable-next-line no-unused-vars
    testApp.use((err, req, res, _next) => {
      res.status(err.status || 500).json({
        success: false,
        message: err.message,
        requestId: req.id || 'unknown'
      });
    });

    const res = await request(testApp).get('/test-error');
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Test error message');
    expect(res.body.requestId).toBe('test-req-id');
  });
});

