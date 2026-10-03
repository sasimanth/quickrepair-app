// backend/tests/cashPaymentSideEffects.test.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { confirmCashPayment } = require('../controllers/cashPaymentController');
const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const User = require('../models/User');

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Cash payment side‑effects and idempotency', () => {
  let mongoServer;
  let bookingId;
  let techUserId;
  let customerId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    const tech = await Technician.create({
      userId: new mongoose.Types.ObjectId().toString(),
      name: 'Tech One',
      email: 'tech1@example.com',
      walletBalance: 0,
    });
    techUserId = tech.userId;
    const customer = await User.create({
      name: 'Customer',
      email: 'cust@example.com',
      password: 'Password123!',
      rewardPoints: 0,
    });
    customerId = customer._id.toString();
    const booking = await Booking.create({
      userId: customerId,
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
    await Booking.findByIdAndUpdate(bookingId, {
      cashCollectedAt: null,
      cashCollectedBy: null,
      cashAmount: 0,
      paymentStatus: 'cash_pending'
    });
  });

  test('Technician wallet and customer loyalty points remain unchanged after cash confirmation', async () => {
    const req = { user: { id: techUserId, role: 'technician' }, body: { bookingId, amount: 1500 } };
    const res = mockResponse();
    await confirmCashPayment(req, res);
    const tech = await Technician.findOne({ userId: techUserId });
    expect(tech.walletBalance).toBe(0);
    const booking = await Booking.findById(bookingId);
    const customer = await User.findById(booking.userId);
    expect(customer.rewardPoints).toBe(0);
  });

  test('Duplicate cash confirmation does not add extra timeline events', async () => {
    // first confirmation
    const req1 = { user: { id: techUserId, role: 'technician' }, body: { bookingId, amount: 1500 } };
    const res1 = mockResponse();
    await confirmCashPayment(req1, res1);
    const afterFirst = await Booking.findById(bookingId);
    const timelineCount = afterFirst.timelineEvents.length;
    // duplicate attempt
    const req2 = { user: { id: techUserId, role: 'technician' }, body: { bookingId, amount: 1500 } };
    const res2 = mockResponse();
    await confirmCashPayment(req2, res2);
    const afterSecond = await Booking.findById(bookingId);
    expect(afterSecond.timelineEvents.length).toBe(timelineCount);
  });
});
