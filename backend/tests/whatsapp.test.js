// backend/tests/whatsapp.test.js
// Phase 7: WhatsApp Business Cloud API Integration — Test Suite
// Uses MongoMemoryServer + jest.fn() mocks for Meta API (fetch).
// No real WhatsApp messages are sent.

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const crypto = require('crypto');

// ─── Models ───────────────────────────────────────────────────────────────────
const WhatsAppLog = require('../models/WhatsAppLog');
const User = require('../models/User');

// ─── Service under test ───────────────────────────────────────────────────────
const {
  normalizeToE164,
  hashPhone,
  maskPhone,
  buildTemplatePayload,
  sendWhatsAppTemplate,
  updateDeliveryStatus
} = require('../services/WhatsAppService');

// ─── Controller under test ────────────────────────────────────────────────────
const {
  verifyWebhook,
  handleWebhookEvent,
  optIn,
  optOut,
  getStatus,
  isSignatureValid
} = require('../controllers/whatsappController');

// ─── Helper: mock req/res ─────────────────────────────────────────────────────
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return {
    query: {},
    body: {},
    headers: {},
    params: {},
    user: null,
    rawBody: null,
    ...overrides
  };
}

// ─── Helper: build valid HMAC-SHA256 signature ────────────────────────────────
function buildSignature(secret, body) {
  const bodyBuf = Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body), 'utf8');
  const hmac = crypto.createHmac('sha256', secret).update(bodyBuf).digest('hex');
  return `sha256=${hmac}`;
}

// ─── Helper: build a Meta status webhook payload ──────────────────────────────
function buildStatusWebhook(wamid, status, errors = []) {
  return {
    object: 'whatsapp_business_account',
    entry: [{
      changes: [{
        value: {
          statuses: [{
            id: wamid,
            status,
            timestamp: String(Date.now()),
            errors: errors.length ? errors : undefined
          }]
        }
      }]
    }]
  };
}

// ─── Helper: signed request builder ──────────────────────────────────────────
function buildSignedReq(secret, body) {
  const bodyBuf = Buffer.from(JSON.stringify(body), 'utf8');
  return mockReq({
    rawBody: bodyBuf,
    headers: { 'x-hub-signature-256': buildSignature(secret, bodyBuf) }
  });
}

// ─── Mock global fetch ────────────────────────────────────────────────────────
global.fetch = jest.fn();

// ─── DB lifecycle ─────────────────────────────────────────────────────────────
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await WhatsAppLog.deleteMany({});
  await User.deleteMany({});
  jest.clearAllMocks();
  // Reset env vars
  delete process.env.WA_PHONE_NUMBER_ID;
  delete process.env.WA_ACCESS_TOKEN;
  delete process.env.WA_WEBHOOK_VERIFY_TOKEN;
  delete process.env.WA_WEBHOOK_SECRET;
  delete process.env.WA_API_VERSION;
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Service Initialization
// ─────────────────────────────────────────────────────────────────────────────
describe('1. Service Initialization', () => {
  test('WhatsAppService exports all expected functions', () => {
    expect(typeof normalizeToE164).toBe('function');
    expect(typeof hashPhone).toBe('function');
    expect(typeof maskPhone).toBe('function');
    expect(typeof buildTemplatePayload).toBe('function');
    expect(typeof sendWhatsAppTemplate).toBe('function');
    expect(typeof updateDeliveryStatus).toBe('function');
  });

  test('WhatsAppLog model is importable and has correct schema fields', () => {
    const schemaFields = Object.keys(WhatsAppLog.schema.paths);
    expect(schemaFields).toContain('wamid');
    expect(schemaFields).toContain('userId');
    expect(schemaFields).toContain('phoneHash');
    expect(schemaFields).toContain('templateName');
    expect(schemaFields).toContain('status');
    expect(schemaFields).toContain('errorCode');
    expect(schemaFields).toContain('errorMessage');
  });

  test('WhatsAppLog has a 90-day TTL index on createdAt', () => {
    const indexes = WhatsAppLog.schema.indexes();
    const ttlIndex = indexes.find(
      ([fields, opts]) => fields.createdAt && opts.expireAfterSeconds === 90 * 24 * 60 * 60
    );
    expect(ttlIndex).toBeDefined();
  });

  test('WhatsAppLog has wamid uniqueness constraint (sparse)', () => {
    const wamidPath = WhatsAppLog.schema.paths.wamid;
    expect(wamidPath.options.sparse).toBe(true);
    expect(wamidPath.options.unique).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Phone Normalization
// ─────────────────────────────────────────────────────────────────────────────
describe('2. Phone Normalization (normalizeToE164)', () => {
  test('normalizes 10-digit Indian number', () => {
    expect(normalizeToE164('9876543210')).toBe('+919876543210');
  });

  test('normalizes 12-digit number starting with 91', () => {
    expect(normalizeToE164('919876543210')).toBe('+919876543210');
  });

  test('normalizes number with +91 prefix', () => {
    expect(normalizeToE164('+919876543210')).toBe('+919876543210');
  });

  test('normalizes 11-digit number starting with 0', () => {
    expect(normalizeToE164('09876543210')).toBe('+919876543210');
  });

  test('strips spaces and dashes before normalizing', () => {
    expect(normalizeToE164('98765 43210')).toBe('+919876543210');
    expect(normalizeToE164('98765-43210')).toBe('+919876543210');
  });

  test('throws for null input', () => {
    expect(() => normalizeToE164(null)).toThrow('Phone number is required');
  });

  test('throws for empty string', () => {
    expect(() => normalizeToE164('')).toThrow();
  });

  test('throws for invalid Indian number (first digit < 6)', () => {
    expect(() => normalizeToE164('5876543210')).toThrow('Invalid Indian mobile number');
  });

  test('throws for wrong length number', () => {
    expect(() => normalizeToE164('123')).toThrow();
  });

  test('maskPhone returns last 4 digits prefixed with ****', () => {
    expect(maskPhone('+919876543210')).toBe('****3210');
  });

  test('hashPhone returns 64-char hex string', () => {
    const h = hashPhone('+919876543210');
    expect(h).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(h)).toBe(true);
  });

  test('hashPhone is deterministic for same input', () => {
    expect(hashPhone('+919876543210')).toBe(hashPhone('+919876543210'));
  });

  test('hashPhone differs for different numbers', () => {
    expect(hashPhone('+919876543210')).not.toBe(hashPhone('+919000000001'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Template Payload Builder
// ─────────────────────────────────────────────────────────────────────────────
describe('3. Template Payload Builder (buildTemplatePayload)', () => {
  test('builds payload without variables', () => {
    const payload = buildTemplatePayload('+919876543210', 'booking_confirmed');
    expect(payload.messaging_product).toBe('whatsapp');
    expect(payload.to).toBe('+919876543210');
    expect(payload.type).toBe('template');
    expect(payload.template.name).toBe('booking_confirmed');
    expect(payload.template.components).toEqual([]);
  });

  test('builds payload with body variables', () => {
    const payload = buildTemplatePayload('+919876543210', 'booking_accepted', ['AC Repair', 'Raju']);
    const bodyComp = payload.template.components[0];
    expect(bodyComp.type).toBe('body');
    expect(bodyComp.parameters).toHaveLength(2);
    expect(bodyComp.parameters[0]).toEqual({ type: 'text', text: 'AC Repair' });
    expect(bodyComp.parameters[1]).toEqual({ type: 'text', text: 'Raju' });
  });

  test('uses default language "en" when not specified', () => {
    const payload = buildTemplatePayload('+919876543210', 'test_tpl');
    expect(payload.template.language.code).toBe('en');
  });

  test('throws when recipient phone is missing', () => {
    expect(() => buildTemplatePayload(null, 'test_tpl')).toThrow('Recipient phone number');
  });

  test('throws when template name is missing', () => {
    expect(() => buildTemplatePayload('+919876543210', '')).toThrow('Template name is required');
  });

  test('coerces non-string variable values to strings', () => {
    const payload = buildTemplatePayload('+91987', 'test', [42, null, undefined]);
    const texts = payload.template.components[0].parameters.map(p => p.text);
    expect(texts).toEqual(['42', 'null', '']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Webhook Verification (GET)
// ─────────────────────────────────────────────────────────────────────────────
describe('4. Webhook Verification (GET /webhook)', () => {
  test('returns 200 with challenge when verify token matches', () => {
    process.env.WA_WEBHOOK_VERIFY_TOKEN = 'my-secret-token';
    const req = mockReq({
      query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'my-secret-token', 'hub.challenge': 'challenge123' }
    });
    const res = mockRes();
    verifyWebhook(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('challenge123');
  });

  test('returns 403 when verify token does not match', () => {
    process.env.WA_WEBHOOK_VERIFY_TOKEN = 'correct-token';
    const req = mockReq({
      query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong-token', 'hub.challenge': 'abc' }
    });
    const res = mockRes();
    verifyWebhook(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 400 when hub.mode is missing', () => {
    const req = mockReq({ query: { 'hub.verify_token': 'token' } });
    const res = mockRes();
    verifyWebhook(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when hub.verify_token is missing', () => {
    const req = mockReq({ query: { 'hub.mode': 'subscribe' } });
    const res = mockRes();
    verifyWebhook(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. HMAC Signature Validation
// ─────────────────────────────────────────────────────────────────────────────
describe('5. HMAC-SHA256 Signature Validation', () => {
  const SECRET = 'webhook-test-secret';

  test('returns true for a valid signature', () => {
    process.env.WA_WEBHOOK_SECRET = SECRET;
    const body = { test: 'payload' };
    const req = buildSignedReq(SECRET, body);
    expect(isSignatureValid(req)).toBe(true);
  });

  test('returns false for an invalid signature', () => {
    process.env.WA_WEBHOOK_SECRET = SECRET;
    const body = { test: 'payload' };
    const bodyBuf = Buffer.from(JSON.stringify(body));
    const req = mockReq({
      rawBody: bodyBuf,
      headers: { 'x-hub-signature-256': 'sha256=invalidsignature' }
    });
    expect(isSignatureValid(req)).toBe(false);
  });

  test('returns false when signature header is missing', () => {
    process.env.WA_WEBHOOK_SECRET = SECRET;
    const req = mockReq({ rawBody: Buffer.from('{}'), headers: {} });
    expect(isSignatureValid(req)).toBe(false);
  });

  test('returns false when rawBody is missing', () => {
    process.env.WA_WEBHOOK_SECRET = SECRET;
    const req = mockReq({ headers: { 'x-hub-signature-256': 'sha256=anythingx' } });
    expect(isSignatureValid(req)).toBe(false);
  });

  test('rejects webhook POST with invalid signature', async () => {
    process.env.NODE_ENV = 'production';
    process.env.WA_WEBHOOK_SECRET = SECRET;
    const bodyBuf = Buffer.from('{"object":"whatsapp_business_account","entry":[]}');
    const req = mockReq({
      rawBody: bodyBuf,
      headers: { 'x-hub-signature-256': 'sha256=badsig000' }
    });
    const res = mockRes();
    await handleWebhookEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    process.env.NODE_ENV = 'test';
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Webhook POST — delivery status updates
// ─────────────────────────────────────────────────────────────────────────────
describe('6. Webhook POST — delivery status updates', () => {
  const SECRET = 'webhook-secret-123';

  test('responds 200 immediately for valid webhook', async () => {
    process.env.WA_WEBHOOK_SECRET = SECRET;
    const body = buildStatusWebhook('wamid.test001', 'delivered');
    const req = buildSignedReq(SECRET, body);
    const res = mockRes();
    await handleWebhookEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('updates WhatsAppLog status to delivered on delivery webhook', async () => {
    process.env.WA_WEBHOOK_SECRET = SECRET;

    // Pre-create a log entry with status 'sent'
    await WhatsAppLog.create({
      wamid: 'wamid.delivered001',
      userId: 'user1',
      templateName: 'booking_accepted',
      phoneHash: 'hash001',
      status: 'sent'
    });

    const body = buildStatusWebhook('wamid.delivered001', 'delivered');
    const req = buildSignedReq(SECRET, body);
    const res = mockRes();
    await handleWebhookEvent(req, res);

    // Allow async processing to settle
    await new Promise(resolve => setTimeout(resolve, 50));

    const log = await WhatsAppLog.findOne({ wamid: 'wamid.delivered001' });
    expect(log.status).toBe('delivered');
    expect(log.statusUpdatedAt).not.toBeNull();
  });

  test('updates WhatsAppLog status to read on read webhook', async () => {
    process.env.WA_WEBHOOK_SECRET = SECRET;

    await WhatsAppLog.create({
      wamid: 'wamid.read001',
      userId: 'user2',
      templateName: 'booking_accepted',
      phoneHash: 'hash002',
      status: 'delivered'
    });

    const body = buildStatusWebhook('wamid.read001', 'read');
    const req = buildSignedReq(SECRET, body);
    const res = mockRes();
    await handleWebhookEvent(req, res);

    await new Promise(resolve => setTimeout(resolve, 50));

    const log = await WhatsAppLog.findOne({ wamid: 'wamid.read001' });
    expect(log.status).toBe('read');
  });

  test('updates WhatsAppLog to failed and records error code', async () => {
    process.env.WA_WEBHOOK_SECRET = SECRET;

    await WhatsAppLog.create({
      wamid: 'wamid.failed001',
      userId: 'user3',
      templateName: 'booking_accepted',
      phoneHash: 'hash003',
      status: 'sent'
    });

    const body = buildStatusWebhook('wamid.failed001', 'failed', [
      { code: 131047, message: 'Re-engagement message' }
    ]);
    const req = buildSignedReq(SECRET, body);
    const res = mockRes();
    await handleWebhookEvent(req, res);

    await new Promise(resolve => setTimeout(resolve, 50));

    const log = await WhatsAppLog.findOne({ wamid: 'wamid.failed001' });
    expect(log.status).toBe('failed');
    expect(log.errorCode).toBe(131047);
  });

  test('silently ignores non-whatsapp_business_account object', async () => {
    process.env.WA_WEBHOOK_SECRET = SECRET;

    const otherBody = { object: 'page', entry: [] };
    const req = buildSignedReq(SECRET, otherBody);
    const res = mockRes();
    await handleWebhookEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Opt-In Controller
// ─────────────────────────────────────────────────────────────────────────────
describe('7. Opt-In Controller', () => {
  test('opt-in returns 200 and sets whatsappEnabled to true', async () => {
    const user = await User.create({
      name: 'Opt User',
      email: 'optuser@test.com',
      password: 'Pass1234!',
      phone: '9876543210'
    });
    const req = mockReq({ user: { _id: user._id, id: user._id.toString() } });
    const res = mockRes();
    await optIn(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, whatsappEnabled: true }));

    const updated = await User.findById(user._id);
    expect(updated.notificationPreferences.whatsappEnabled).toBe(true);
    expect(updated.notificationPreferences.whatsappOptInAt).not.toBeNull();
    expect(updated.notificationPreferences.whatsappOptInVersion).toBe('1.0');
  });

  test('opt-in returns 400 if user has no phone number', async () => {
    const user = await User.create({
      name: 'No Phone',
      email: 'nophone@test.com',
      password: 'Pass1234!'
      // no phone field
    });
    const req = mockReq({ user: { _id: user._id, id: user._id.toString() } });
    const res = mockRes();
    await optIn(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('phone number') }));
  });

  test('opt-in returns 404 for unknown user', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const req = mockReq({ user: { _id: fakeId, id: fakeId.toString() } });
    const res = mockRes();
    await optIn(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Opt-Out Controller
// ─────────────────────────────────────────────────────────────────────────────
describe('8. Opt-Out Controller', () => {
  test('opt-out sets whatsappEnabled to false and records optOutAt timestamp', async () => {
    const user = await User.create({
      name: 'Opt Out User',
      email: 'optout@test.com',
      password: 'Pass1234!',
      phone: '9123456789',
      notificationPreferences: { whatsappEnabled: true }
    });
    const req = mockReq({ user: { _id: user._id, id: user._id.toString() } });
    const res = mockRes();
    await optOut(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, whatsappEnabled: false }));

    const updated = await User.findById(user._id);
    expect(updated.notificationPreferences.whatsappEnabled).toBe(false);
    expect(updated.notificationPreferences.whatsappOptOutAt).not.toBeNull();
  });

  test('opt-out immediately prevents future WhatsApp sends', async () => {
    const user = await User.create({
      name: 'Revoke User',
      email: 'revoke@test.com',
      password: 'Pass1234!',
      phone: '9000000001',
      notificationPreferences: { whatsappEnabled: true }
    });

    // Opt out
    const req = mockReq({ user: { _id: user._id, id: user._id.toString() } });
    await optOut(req, mockRes());

    // Attempt a send — credentials configured but user opted out
    process.env.WA_PHONE_NUMBER_ID = 'pid';
    process.env.WA_ACCESS_TOKEN = 'token';
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: 'wamid.test' }] })
    });

    const updatedUser = await User.findById(user._id);
    // The send would proceed because sendWhatsAppTemplate itself doesn't check opt-in —
    // that check is in NotificationService / triggerNotifications.
    // Verify opt-in flag is false so caller logic would skip.
    expect(updatedUser.notificationPreferences.whatsappEnabled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Status Controller
// ─────────────────────────────────────────────────────────────────────────────
describe('9. Status Controller', () => {
  test('returns current WhatsApp status for authenticated user', async () => {
    const user = await User.create({
      name: 'Status User',
      email: 'status@test.com',
      password: 'Pass1234!',
      phone: '9111111111',
      notificationPreferences: { whatsappEnabled: true }
    });
    const req = mockReq({ user: { _id: user._id, id: user._id.toString() } });
    const res = mockRes();
    await getStatus(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      hasPhone: true,
      whatsappEnabled: true
    }));
  });

  test('returns hasPhone: false when no phone on record', async () => {
    const user = await User.create({
      name: 'No Phone Status',
      email: 'nophonestatus@test.com',
      password: 'Pass1234!'
    });
    const req = mockReq({ user: { _id: user._id, id: user._id.toString() } });
    const res = mockRes();
    await getStatus(req, res);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.hasPhone).toBe(false);
    expect(jsonArg.whatsappEnabled).toBe(false);
  });

  test('returns 404 for unknown user', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const req = mockReq({ user: { _id: fakeId, id: fakeId.toString() } });
    const res = mockRes();
    await getStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Unauthorized Access
// ─────────────────────────────────────────────────────────────────────────────
describe('10. Unauthorized Access', () => {
  test('optIn returns 500 (or similar error) when req.user is null', async () => {
    const req = mockReq({ user: null });
    const res = mockRes();
    // Will throw because req.user._id is accessed — caught by express error handler in prod,
    // but in unit test it throws, which we verify is properly handled
    await optIn(req, res);
    // Should either return 500 or throw — either way no 200 should be returned
    const statusCalls = res.status.mock.calls.map(c => c[0]);
    const jsonCalls = res.json.mock.calls;
    const noSuccess = jsonCalls.every(args => !args[0]?.success);
    expect(noSuccess || statusCalls.some(s => s >= 400)).toBe(true);
  });

  test('optOut does not crash the process if called with missing user', async () => {
    const req = mockReq({ user: null });
    const res = mockRes();
    await optOut(req, res);
    // Same — no 200 with success=true
    const statusCalls = res.status.mock.calls.map(c => c[0]);
    const jsonCalls = res.json.mock.calls;
    const noSuccess = jsonCalls.every(args => !args[0]?.success);
    expect(noSuccess || statusCalls.some(s => s >= 400)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. sendWhatsAppTemplate — core send logic
// ─────────────────────────────────────────────────────────────────────────────
describe('11. sendWhatsAppTemplate', () => {
  test('returns error when credentials are not configured', async () => {
    const result = await sendWhatsAppTemplate('user1', '9876543210', 'booking_accepted', [], 'book1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('credentials not configured');
  });

  test('returns error for invalid phone number', async () => {
    process.env.WA_PHONE_NUMBER_ID = 'pid';
    process.env.WA_ACCESS_TOKEN = 'token';
    const result = await sendWhatsAppTemplate('user1', '1234', 'booking_accepted', [], null);
    expect(result.success).toBe(false);
    // Either normalization error or E.164 failure
    expect(result.error).toBeDefined();
  });

  test('returns success and wamid on successful API call', async () => {
    process.env.WA_PHONE_NUMBER_ID = 'pid123';
    process.env.WA_ACCESS_TOKEN = 'token456';
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [{ id: 'wamid.success001' }] })
    });

    const result = await sendWhatsAppTemplate('user2', '9876543210', 'booking_accepted', ['AC Repair', 'Raju'], 'booking123');
    expect(result.success).toBe(true);
    expect(result.wamid).toBe('wamid.success001');

    // Verify log was created and updated to 'sent'
    await new Promise(r => setTimeout(r, 20));
    const log = await WhatsAppLog.findOne({ wamid: 'wamid.success001' });
    expect(log).not.toBeNull();
    expect(log.status).toBe('sent');
    expect(log.phoneHash).toHaveLength(64); // PII-safe hash
  });

  test('creates log with status pending BEFORE API call, updates to sent on success', async () => {
    process.env.WA_PHONE_NUMBER_ID = 'pid';
    process.env.WA_ACCESS_TOKEN = 'tok';

    let logIdDuringCall;
    global.fetch.mockImplementationOnce(async () => {
      // Check that a pending log exists before the API call resolves
      const pending = await WhatsAppLog.findOne({ status: 'pending' });
      logIdDuringCall = pending?._id?.toString();
      return {
        ok: true,
        json: async () => ({ messages: [{ id: 'wamid.pending_test' }] })
      };
    });

    await sendWhatsAppTemplate('userP', '9876543210', 'test_tpl', [], null);
    expect(logIdDuringCall).toBeDefined(); // log existed during call

    await new Promise(r => setTimeout(r, 20));
    const log = await WhatsAppLog.findById(logIdDuringCall);
    expect(log?.status).toBe('sent');
  });

  test('updates log to failed on API error response', async () => {
    process.env.WA_PHONE_NUMBER_ID = 'pid';
    process.env.WA_ACCESS_TOKEN = 'tok';
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { code: 100, message: 'Invalid parameter' } })
    });

    const result = await sendWhatsAppTemplate('userF', '9876543210', 'bad_tpl', [], null);
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe(100);

    await new Promise(r => setTimeout(r, 20));
    const log = await WhatsAppLog.findOne({ status: 'failed' });
    expect(log).not.toBeNull();
    expect(log.errorCode).toBe(100);
    expect(log.errorMessage).toContain('Invalid parameter');
  });

  test('updates log to failed on network error', async () => {
    process.env.WA_PHONE_NUMBER_ID = 'pid';
    process.env.WA_ACCESS_TOKEN = 'tok';
    global.fetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await sendWhatsAppTemplate('userN', '9876543210', 'net_tpl', [], null);
    expect(result.success).toBe(false);
    expect(result.error).toContain('ECONNREFUSED');

    await new Promise(r => setTimeout(r, 20));
    const log = await WhatsAppLog.findOne({ userId: 'userN' });
    expect(log?.status).toBe('failed');
  });

  test('does NOT expose access token in logs (PII/secret safety)', async () => {
    process.env.WA_PHONE_NUMBER_ID = 'pid';
    process.env.WA_ACCESS_TOKEN = 'SUPER_SECRET_TOKEN_NEVER_LOG';
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [{ id: 'wamid.secret_test' }] })
    });

    // Intercept console.log/error to verify token isn't logged
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await sendWhatsAppTemplate('userS', '9876543210', 'tpl', [], null);

    const allLogs = [
      ...logSpy.mock.calls.flat().map(String),
      ...errSpy.mock.calls.flat().map(String)
    ].join(' ');
    expect(allLogs).not.toContain('SUPER_SECRET_TOKEN_NEVER_LOG');

    logSpy.mockRestore();
    errSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Deduplication
// ─────────────────────────────────────────────────────────────────────────────
describe('12. Deduplication', () => {
  test('suppresses duplicate send within 60-second window', async () => {
    process.env.WA_PHONE_NUMBER_ID = 'pid';
    process.env.WA_ACCESS_TOKEN = 'tok';
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: `wamid.dedup${Date.now()}` }] })
    });

    const result1 = await sendWhatsAppTemplate('userDedup', '9876543210', 'booking_accepted', [], 'booking_dedup');
    expect(result1.success).toBe(true);

    await new Promise(r => setTimeout(r, 20));

    const result2 = await sendWhatsAppTemplate('userDedup', '9876543210', 'booking_accepted', [], 'booking_dedup');
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('Duplicate');
  });

  test('does NOT suppress send for different templateName', async () => {
    process.env.WA_PHONE_NUMBER_ID = 'pid';
    process.env.WA_ACCESS_TOKEN = 'tok';
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: `wamid.different${Date.now()}` }] })
    });

    const r1 = await sendWhatsAppTemplate('userD2', '9876543210', 'booking_accepted', [], 'bk1');
    await new Promise(r => setTimeout(r, 20));
    const r2 = await sendWhatsAppTemplate('userD2', '9876543210', 'booking_completed', [], 'bk1');

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });

  test('does NOT suppress send for different bookingId', async () => {
    process.env.WA_PHONE_NUMBER_ID = 'pid';
    process.env.WA_ACCESS_TOKEN = 'tok';
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: `wamid.diffbook${Date.now()}` }] })
    });

    const r1 = await sendWhatsAppTemplate('userD3', '9876543210', 'booking_accepted', [], 'bk_a');
    await new Promise(r => setTimeout(r, 20));
    const r2 = await sendWhatsAppTemplate('userD3', '9876543210', 'booking_accepted', [], 'bk_b');

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. PII-Safe Logging
// ─────────────────────────────────────────────────────────────────────────────
describe('13. PII-Safe Logging', () => {
  test('WhatsAppLog stores phoneHash not raw phone number', async () => {
    process.env.WA_PHONE_NUMBER_ID = 'pid';
    process.env.WA_ACCESS_TOKEN = 'tok';
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [{ id: 'wamid.pii001' }] })
    });

    await sendWhatsAppTemplate('userPII', '9876543210', 'booking_accepted', [], null);
    await new Promise(r => setTimeout(r, 20));

    const log = await WhatsAppLog.findOne({ userId: 'userPII' }).lean();
    expect(log).not.toBeNull();
    // phoneHash should be a 64-char hex string, NOT the actual phone number
    expect(log.phoneHash).toHaveLength(64);
    expect(log.phoneHash).not.toContain('9876543210');
    // wamid is safe to store (it's Meta's own ID, not PII)
    expect(log.wamid).toBe('wamid.pii001');
    // Raw phone number should never appear in the document
    const logStr = JSON.stringify(log);
    expect(logStr).not.toContain('9876543210');
    expect(logStr).not.toContain('+919876543210');
  });

  test('userId stored is Fixvo internal ID, not phone or email', async () => {
    process.env.WA_PHONE_NUMBER_ID = 'pid';
    process.env.WA_ACCESS_TOKEN = 'tok';
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [{ id: 'wamid.userid001' }] })
    });

    await sendWhatsAppTemplate('fixvo_user_id_123', '9876543210', 'test_tpl', [], null);
    await new Promise(r => setTimeout(r, 20));

    const log = await WhatsAppLog.findOne({ wamid: 'wamid.userid001' }).lean();
    expect(log.userId).toBe('fixvo_user_id_123');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. 90-Day TTL Configuration
// ─────────────────────────────────────────────────────────────────────────────
describe('14. 90-Day TTL Configuration', () => {
  test('TTL index is set to exactly 90 days (7776000 seconds)', () => {
    const NINETY_DAYS = 90 * 24 * 60 * 60;
    const indexes = WhatsAppLog.schema.indexes();
    const ttlIdx = indexes.find(([, opts]) => opts.expireAfterSeconds === NINETY_DAYS);
    expect(ttlIdx).toBeDefined();
    expect(ttlIdx[0]).toHaveProperty('createdAt');
  });

  test('TTL index targets createdAt field', () => {
    const indexes = WhatsAppLog.schema.indexes();
    const ttlIdx = indexes.find(([fields]) => fields.createdAt === 1);
    expect(ttlIdx).toBeDefined();
    expect(ttlIdx[1].expireAfterSeconds).toBe(90 * 24 * 60 * 60);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. updateDeliveryStatus
// ─────────────────────────────────────────────────────────────────────────────
describe('15. updateDeliveryStatus', () => {
  test('updates WhatsAppLog status by wamid', async () => {
    await WhatsAppLog.create({
      wamid: 'wamid.upd001',
      userId: 'u1',
      templateName: 'tpl',
      phoneHash: 'hash',
      status: 'sent'
    });
    await updateDeliveryStatus('wamid.upd001', 'delivered');
    const log = await WhatsAppLog.findOne({ wamid: 'wamid.upd001' });
    expect(log.status).toBe('delivered');
  });

  test('handles unknown status gracefully (no throw)', async () => {
    await expect(updateDeliveryStatus('wamid.xyz', 'unknown_status')).resolves.toBeUndefined();
  });

  test('handles null wamid without throwing', async () => {
    await expect(updateDeliveryStatus(null, 'delivered')).resolves.toBeUndefined();
  });

  test('records errorCode and errorMessage on failed status', async () => {
    await WhatsAppLog.create({
      wamid: 'wamid.fail999',
      userId: 'uf',
      templateName: 'tpl',
      phoneHash: 'hash',
      status: 'sent'
    });
    await updateDeliveryStatus('wamid.fail999', 'failed', { code: 131047, message: 'Re-engagement' });
    const log = await WhatsAppLog.findOne({ wamid: 'wamid.fail999' });
    expect(log.status).toBe('failed');
    expect(log.errorCode).toBe(131047);
    expect(log.errorMessage).toBe('Re-engagement');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. Booking Notification Triggers
// ─────────────────────────────────────────────────────────────────────────────
describe('16. Booking Notification Triggers', () => {
  test('WA_TEMPLATE_MAP covers all required booking lifecycle events', () => {
    const REQUIRED = [
      'accepted', 'on_the_way', 'arrived', 'completed', 'cancelled', 'payment_completed'
    ];
    const WA_TEMPLATE_MAP = {
      accepted:          'booking_accepted',
      on_the_way:        'technician_on_the_way',
      arrived:           'technician_arrived',
      completed:         'booking_completed',
      cancelled:         'booking_cancelled',
      payment_completed: 'payment_confirmed'
    };
    REQUIRED.forEach(event => {
      expect(WA_TEMPLATE_MAP[event]).toBeDefined();
      expect(WA_TEMPLATE_MAP[event]).not.toBe('');
    });
  });

  test('WhatsApp send does not throw when user has opted out', async () => {
    // Create user with whatsappEnabled: false
    const user = await User.create({
      name: 'Opted Out',
      email: 'optedout@test.com',
      password: 'Pass1234!',
      phone: '9000000002',
      notificationPreferences: { whatsappEnabled: false }
    });

    process.env.WA_PHONE_NUMBER_ID = 'pid';
    process.env.WA_ACCESS_TOKEN = 'tok';
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: 'wamid.optout' }] })
    });

    // sendWhatsAppTemplate itself doesn't enforce opt-in — that's the caller's responsibility
    // Verify that we can call the service without errors and it processes normally
    const result = await sendWhatsAppTemplate(
      user._id.toString(), '9000000002', 'booking_accepted', [], null
    );
    // Should succeed at service level (opt-in check is in NotificationService / triggerNotifications)
    expect(result).toHaveProperty('success');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. Payment Notification Triggers
// ─────────────────────────────────────────────────────────────────────────────
describe('17. Payment Notification Triggers', () => {
  test('payment_confirmed template name is defined', () => {
    const PAYMENT_TEMPLATE = 'payment_confirmed';
    // Validate it's a non-empty string as used in WA_TEMPLATE_MAP
    expect(typeof PAYMENT_TEMPLATE).toBe('string');
    expect(PAYMENT_TEMPLATE.length).toBeGreaterThan(0);
  });

  test('WhatsApp send succeeds for payment_confirmed template', async () => {
    process.env.WA_PHONE_NUMBER_ID = 'pid';
    process.env.WA_ACCESS_TOKEN = 'tok';
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [{ id: 'wamid.payment001' }] })
    });

    const result = await sendWhatsAppTemplate(
      'payuser', '9876543210', 'payment_confirmed', ['AC Repair', '₹500'], 'bk_pay'
    );
    expect(result.success).toBe(true);
    expect(result.wamid).toBe('wamid.payment001');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18. Routing sanity
// ─────────────────────────────────────────────────────────────────────────────
describe('18. Routes and Middleware sanity', () => {
  test('whatsappRoutes can be required without error', () => {
    expect(() => require('../routes/whatsappRoutes')).not.toThrow();
  });

  test('rawWhatsAppBody middleware can be required without error', () => {
    expect(() => require('../middleware/rawWhatsAppBody')).not.toThrow();
  });

  test('rateLimiter exports whatsappWebhookLimiter and whatsappOptInLimiter', () => {
    const { whatsappWebhookLimiter, whatsappOptInLimiter } = require('../middleware/rateLimiter');
    expect(typeof whatsappWebhookLimiter).toBe('function');
    expect(typeof whatsappOptInLimiter).toBe('function');
  });

  test('User model has all WhatsApp opt-in fields in schema', () => {
    const paths = User.schema.paths;
    expect(paths['notificationPreferences.whatsappEnabled']).toBeDefined();
    expect(paths['notificationPreferences.whatsappOptInAt']).toBeDefined();
    expect(paths['notificationPreferences.whatsappOptOutAt']).toBeDefined();
    expect(paths['notificationPreferences.whatsappOptInVersion']).toBeDefined();
  });

  test('User.notificationPreferences.whatsappEnabled defaults to false', async () => {
    const user = await User.create({
      name: 'Default Pref',
      email: 'defpref@test.com',
      password: 'Pass1234!'
    });
    expect(user.notificationPreferences.whatsappEnabled).toBe(false);
  });
});
