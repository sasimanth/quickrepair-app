const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

let mongoServer;
let app;
const JWT_SECRET = 'test_secret_key_12345';
let userToken;
let adminToken;
let createdTicketId;

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.NODE_ENV = 'test';
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  const testUser = await User.create({
    name: 'Customer Test',
    email: 'customer@fixvo.com',
    phone: '9988771122',
    password: 'Password123!',
    role: 'user'
  });

  const testAdmin = await User.create({
    name: 'Admin Test',
    email: 'admin@fixvo.com',
    phone: '9988771123',
    password: 'Password123!',
    role: 'admin'
  });

  userToken = jwt.sign({ id: testUser._id.toString(), role: 'user', email: testUser.email }, JWT_SECRET);
  adminToken = jwt.sign({ id: testAdmin._id.toString(), role: 'admin', email: testAdmin.email }, JWT_SECRET);

  app = express();
  app.use(express.json());
  app.use('/api/support', require('../routes/supportRoutes'));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Support Ticket APIs', () => {
  test('POST /api/support creates a new support ticket', async () => {
    const res = await request(app)
      .post('/api/support')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        category: 'Booking',
        subject: 'Technician delay query',
        message: 'My technician is 10 minutes late, please check update.'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.ticket).toHaveProperty('ticketId');
    expect(res.body.ticket.subject).toBe('Technician delay query');
    createdTicketId = res.body.ticket._id;
  });

  test('GET /api/support/my-tickets fetches customer tickets', async () => {
    const res = await request(app)
      .get('/api/support/my-tickets')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].subject).toBe('Technician delay query');
  });

  test('GET /api/support/admin/tickets requires admin role', async () => {
    const userRes = await request(app)
      .get('/api/support/admin/tickets')
      .set('Authorization', `Bearer ${userToken}`);

    expect(userRes.statusCode).toBe(403);

    const adminRes = await request(app)
      .get('/api/support/admin/tickets')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminRes.statusCode).toBe(200);
    expect(Array.isArray(adminRes.body)).toBe(true);
    expect(adminRes.body.length).toBe(1);
  });

  test('PUT /api/support/admin/tickets/:id updates ticket status & resolution', async () => {
    const res = await request(app)
      .put(`/api/support/admin/tickets/${createdTicketId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'resolved',
        resolution: 'Contacted technician, arriving in 5 mins.',
        adminNotes: 'Resolved via phone call.'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.ticket.status).toBe('resolved');
    expect(res.body.ticket.resolution).toContain('Contacted technician');
  });
});
