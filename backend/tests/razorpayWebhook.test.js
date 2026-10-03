// backend/tests/razorpayWebhook.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock notification trigger to verify it is called only once per event
const webhookSecret = 'test_webhook_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;

jest.mock('../controllers/bookingController', () => {
  const original = jest.requireActual('../controllers/bookingController');
  return {
    ...original,
    triggerNotifications: jest.fn().mockResolvedValue(undefined),
  };
});

// triggerNotifications will be available from the mocked module when required later in tests.
const { triggerNotifications } = require('../controllers/bookingController');

// Import the Express app (server.js exports {app, server})
const { app } = require('../server');

let mongoServer;
let bookingId;

// Helper to generate Razorpay signature header
function signPayload(payload) {
  return crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
}

// Load models
const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const User = require('../models/User');

// Increase default Jest timeout for async operations
jest.setTimeout(30000);

beforeAll(async () => {
  // Create in-memory MongoDB server without custom storage engine (default works)
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Seed a technician, user and booking
  const tech = await Technician.create({ userId: new mongoose.Types.ObjectId().toString(), name: 'Test Tech', email: 'tech@example.com', walletBalance: 0 });
  const user = await User.create({ name: 'Test User', email: 'user@example.com', password: 'Password123!', rewardPoints: 0 });
  const booking = await Booking.create({
    _id: new mongoose.Types.ObjectId(),
    userId: user._id,
    providerId: tech.userId,
    name: 'Test User',
    phone: '1234567890',
    serviceName: 'Plumbing',
    problemDescription: 'Leaky faucet',
    location: 'Test Street',
    date: new Date(),
    finalQuote: 1000,
    amount: 1000,
    paymentStatus: 'pending',
    walletUpdated: false,
  });
  bookingId = booking._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Razorpay webhook security and correctness', () => {
  test('Valid signature processes payment.captured', async () => {
    const payload = JSON.stringify({
      id: 'evt_test_1',
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_123', notes: { bookingId: bookingId } } } },
    });
    const sig = signPayload(payload);
    const res = await request(app)
      .post('/api/payments/razorpay/webhook')
      .set('x-razorpay-signature', sig)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(res.status).toBe(200);
    const booking = await Booking.findById(bookingId);
    expect(booking.paymentStatus).toBe('completed');
    expect(booking.transactionId).toBe('pay_123');
    const tech = await Technician.findOne({ userId: booking.providerId });
    expect(tech.walletBalance).toBe(1000);
    const user = await User.findById(booking.userId);
    expect(user.rewardPoints).toBe(100);
    expect(triggerNotifications).toHaveBeenCalledTimes(1);
  });

  test('Invalid signature is rejected', async () => {
    const payload = JSON.stringify({ id: 'evt_invalid', event: 'payment.captured' });
    const res = await request(app)
      .post('/api/payments/razorpay/webhook')
      .set('x-razorpay-signature', 'bad_signature')
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(res.status).toBe(400);
  });

  test('Payload larger than 1 MB returns 413', async () => {
    const largeObject = { data: 'a'.repeat(1 * 1024 * 1024 + 100) };
    const payload = JSON.stringify(largeObject);
    const sig = signPayload(payload);
    const res = await request(app)
      .post('/api/payments/razorpay/webhook')
      .set('x-razorpay-signature', sig)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(res.status).toBe(413);
  });

  test('Duplicate payment.captured does not duplicate wallet or points', async () => {
    const payload = JSON.stringify({
      id: 'evt_duplicate',
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_dup', notes: { bookingId: bookingId } } } },
    });
    const sig = signPayload(payload);
    // First call
    await request(app)
      .post('/api/payments/razorpay/webhook')
      .set('x-razorpay-signature', sig)
      .set('Content-Type', 'application/json')
      .send(payload);
    const techBefore = await Technician.findOne({ userId: (await Booking.findById(bookingId)).providerId });
    const userBefore = await User.findById((await Booking.findById(bookingId)).userId);
    // Duplicate call
    const res = await request(app)
      .post('/api/payments/razorpay/webhook')
      .set('x-razorpay-signature', sig)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(res.status).toBe(200);
    const techAfter = await Technician.findOne({ userId: (await Booking.findById(bookingId)).providerId });
    const userAfter = await User.findById((await Booking.findById(bookingId)).userId);
    expect(techAfter.walletBalance).toBe(techBefore.walletBalance);
    expect(userAfter.rewardPoints).toBe(userBefore.rewardPoints);
    const RazorpayEvent = require('../models/RazorpayEvent');
    const events = await RazorpayEvent.find({ eventId: 'evt_duplicate' });
    expect(events).toHaveLength(1);
    expect(triggerNotifications).toHaveBeenCalledTimes(1);
  });

  test('Refund processed updates status and triggers notification once', async () => {
    await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'completed' });
    const payload = JSON.stringify({
      id: 'evt_refund',
      event: 'refund.processed',
      payload: { refund: { entity: { id: 'refund_123', notes: { bookingId: bookingId } } } },
    });
    const sig = signPayload(payload);
    const res = await request(app)
      .post('/api/payments/razorpay/webhook')
      .set('x-razorpay-signature', sig)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(res.status).toBe(200);
    const booking = await Booking.findById(bookingId);
    expect(booking.paymentStatus).toBe('refunded');
    expect(triggerNotifications).toHaveBeenCalledTimes(1);
    // Duplicate refund should not fire another notification
    await request(app)
      .post('/api/payments/razorpay/webhook')
      .set('x-razorpay-signature', sig)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(triggerNotifications).toHaveBeenCalledTimes(1);
  });

  test('Transaction not supported returns 500', async () => {
    const transactionSupport = require('../utils/transactionSupport');
    jest.spyOn(transactionSupport, 'withTransaction').mockImplementation(() => {
      throw new Error('MongoDB transactions are not supported in this deployment');
    });
    const payload = JSON.stringify({
      id: 'evt_no_tx',
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_ntx' } } },
    });
    const sig = signPayload(payload);
    const res = await request(app)
      .post('/api/payments/razorpay/webhook')
      .set('x-razorpay-signature', sig)
      .set('Content-Type', 'application/json')
      .send(payload);
    expect(res.status).toBe(500);
    jest.restoreAllMocks();
  });
});
