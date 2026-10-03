const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../server');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Technician = require('../models/Technician');
const Booking = require('../models/Booking');

let mongoServer;
let customerUser, customerToken;
let techUser, techToken, techProfile;
let unauthorizedUser, unauthorizedToken;
let adminUser, adminToken;
let booking;

describe('Live Technician Tracking & Socket Authorization Tests', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(uri);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Technician.deleteMany({});
    await Booking.deleteMany({});

    const secret = process.env.JWT_SECRET || 'secret123';

    // 1. Customer
    customerUser = await User.create({
      name: 'Tracking Customer',
      email: 'track_cust@example.com',
      password: 'Password123!',
      phone: '+919999111222',
      role: 'user',
      isEmailVerified: true
    });
    customerToken = jwt.sign(
      { id: customerUser._id.toString(), role: customerUser.role, email: customerUser.email },
      secret,
      { expiresIn: '1h' }
    );

    // 2. Technician
    techUser = await User.create({
      name: 'Tracking Tech',
      email: 'track_tech@example.com',
      password: 'Password123!',
      phone: '+919999333444',
      role: 'technician',
      isEmailVerified: true
    });
    techToken = jwt.sign(
      { id: techUser._id.toString(), role: techUser.role, email: techUser.email },
      secret,
      { expiresIn: '1h' }
    );
    techProfile = await Technician.create({
      userId: techUser._id.toString(),
      name: techUser.name,
      email: techUser.email,
      phone: techUser.phone,
      isOnline: true,
      currentStatus: 'available'
    });

    // 3. Unauthorized User
    unauthorizedUser = await User.create({
      name: 'Unauthorized User',
      email: 'unauth@example.com',
      password: 'Password123!',
      phone: '+919999555666',
      role: 'user',
      isEmailVerified: true
    });
    unauthorizedToken = jwt.sign(
      { id: unauthorizedUser._id.toString(), role: unauthorizedUser.role, email: unauthorizedUser.email },
      secret,
      { expiresIn: '1h' }
    );

    // 4. Admin User
    adminUser = await User.create({
      name: 'Tracking Admin',
      email: 'admin_track@example.com',
      password: 'Password123!',
      phone: '+919999777888',
      role: 'admin',
      isEmailVerified: true
    });
    adminToken = jwt.sign(
      { id: adminUser._id.toString(), role: adminUser.role, email: adminUser.email },
      secret,
      { expiresIn: '1h' }
    );

    // Create Active Booking
    booking = await Booking.create({
      userId: customerUser._id.toString(),
      userEmail: customerUser.email,
      name: customerUser.name,
      phone: customerUser.phone,
      serviceName: 'AC Repair',
      deviceType: 'Split AC',
      problemDescription: 'Cooling issues',
      location: 'Madanapalle Market Yard',
      latitude: 13.5502,
      longitude: 78.5028,
      providerId: techUser._id.toString(),
      providerEmail: techUser.email,
      providerPhone: techUser.phone,
      status: 'accepted',
      date: new Date()
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Technician.deleteMany({});
    await Booking.deleteMany({});
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('1. GET /api/bookings/:id/tracking Access Control', () => {
    test('Allows assigned customer to access tracking', async () => {
      const res = await request(app)
        .get(`/api/bookings/${booking._id}/tracking`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.bookingId).toBe(booking._id.toString());
      expect(res.body.customerCoords.lat).toBe(13.5502);
      expect(res.body.customerCoords.lng).toBe(78.5028);
    });

    test('Allows assigned technician to access tracking', async () => {
      const res = await request(app)
        .get(`/api/bookings/${booking._id}/tracking`)
        .set('Authorization', `Bearer ${techToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.bookingId).toBe(booking._id.toString());
    });

    test('Allows admin to access tracking', async () => {
      const res = await request(app)
        .get(`/api/bookings/${booking._id}/tracking`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });

    test('Blocks unauthorized user from accessing tracking (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/bookings/${booking._id}/tracking`)
        .set('Authorization', `Bearer ${unauthorizedToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/not authorized/i);
    });
  });

  describe('2. Tracking Lifecycle & Status Progression', () => {
    test('Sets trackingActive: true when technician moves status to on_the_way', async () => {
      const res = await request(app)
        .put(`/api/bookings/${booking._id}/status`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ status: 'on_the_way' });

      expect(res.statusCode).toBe(200);

      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking.status).toBe('on_the_way');
      expect(updatedBooking.trackingActive).toBe(true);
    });

    test('Sets trackingActive: false and resets coordinates when technician arrives', async () => {
      // First move to on_the_way and set coordinates
      await Booking.findByIdAndUpdate(booking._id, {
        status: 'on_the_way',
        trackingActive: true,
        lastTechLat: 13.5510,
        lastTechLng: 78.5035
      });

      const res = await request(app)
        .put(`/api/bookings/${booking._id}/status`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ status: 'arrived' });

      expect(res.statusCode).toBe(200);

      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking.status).toBe('arrived');
      expect(updatedBooking.trackingActive).toBe(false);
      expect(updatedBooking.lastTechLat).toBeNull();
      expect(updatedBooking.lastTechLng).toBeNull();
    });

    test('Sets trackingActive: false when booking is completed', async () => {
      await Booking.findByIdAndUpdate(booking._id, {
        status: 'on_the_way',
        trackingActive: true,
        lastTechLat: 13.5510,
        lastTechLng: 78.5035
      });

      const res = await request(app)
        .put(`/api/bookings/${booking._id}/status`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ status: 'completed' });

      expect(res.statusCode).toBe(200);

      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking.status).toBe('completed');
      expect(updatedBooking.trackingActive).toBe(false);
      expect(updatedBooking.lastTechLat).toBeNull();
    });
  });
});
