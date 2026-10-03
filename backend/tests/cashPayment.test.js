// backend/tests/cashPayment.test.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { confirmCashPayment } = require('../controllers/cashPaymentController');
const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const User = require('../models/User');

// Helper to create mock req/res
function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Cash payment confirmation flow', () => {
  let mongoServer;
  let bookingId;
  let techUserId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    // Create a technician user
    const tech = await Technician.create({
      userId: new mongoose.Types.ObjectId().toString(),
      name: 'Tech One',
      email: 'tech1@example.com',
      walletBalance: 0,
    });
    techUserId = tech.userId;
    // Create a regular user
    await User.create({
      name: 'Customer',
      email: 'cust@example.com',
      password: 'Password123!',
    });
    // Create a booking in cash_pending state assigned to the technician
    const booking = await Booking.create({
      userId: new mongoose.Types.ObjectId().toString(),
      providerId: techUserId,
      name: 'Customer',
      phone: '1234567890',
      serviceName: 'Plumbing',
      problemDescription: 'Leaky faucet',
      location: 'Test Street',
      date: new Date(),
      finalQuote: 1500,
      amount: 1500,
      paymentStatus: 'cash_pending',
    });
    bookingId = booking._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    // Reset cashCollectedAt to null for idempotency tests
    await Booking.findByIdAndUpdate(bookingId, { cashCollectedAt: null, cashCollectedBy: null, cashAmount: 0, paymentStatus: 'cash_pending' });
  });

  test('Authorized technician can confirm cash with correct amount', async () => {
    const req = {
      user: { id: techUserId, role: 'technician' },
      body: { bookingId, amount: 1500 },
    };
    const res = mockResponse();
    await confirmCashPayment(req, res);
    expect(res.json).toHaveBeenCalledTimes(1);
    const updated = await Booking.findById(bookingId);
    expect(updated.paymentStatus).toBe('cash_completed');
    expect(updated.cashCollectedAt).toBeTruthy();
    expect(updated.cashCollectedBy).toBe(techUserId);
    expect(updated.cashAmount).toBe(1500);
  });

  test('Reject when amount mismatches expected', async () => {
    const req = {
      user: { id: techUserId, role: 'technician' },
      body: { bookingId, amount: 1400 }, // mismatch
    };
    const res = mockResponse();
    await confirmCashPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const updated = await Booking.findById(bookingId);
    expect(updated.paymentStatus).toBe('cash_pending');
  });

  test('Reject when technician not assigned to booking', async () => {
    const otherTechId = new mongoose.Types.ObjectId().toString();
    const req = {
      user: { id: otherTechId, role: 'technician' },
      body: { bookingId, amount: 1500 },
    };
    const res = mockResponse();
    await confirmCashPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('Reject duplicate cash confirmation', async () => {
    // First successful confirmation
    const req1 = { user: { id: techUserId, role: 'technician' }, body: { bookingId, amount: 1500 } };
    const res1 = mockResponse();
    await confirmCashPayment(req1, res1);
    // Second attempt should fail
    const req2 = { user: { id: techUserId, role: 'technician' }, body: { bookingId, amount: 1500 } };
    const res2 = mockResponse();
    await confirmCashPayment(req2, res2);
    expect(res2.status).toHaveBeenCalledWith(400);
  });

  test('Reject when booking not in cash_pending state', async () => {
    await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'completed' });
    const req = { user: { id: techUserId, role: 'technician' }, body: { bookingId, amount: 1500 } };
    const res = mockResponse();
    await confirmCashPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('Return 404 when booking does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const req = { user: { id: techUserId, role: 'technician' }, body: { bookingId: fakeId, amount: 1500 } };
    const res = mockResponse();
    await confirmCashPayment(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
