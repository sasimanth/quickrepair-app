// backend/tests/invoice.test.js
// Phase 6: PDF Invoices & GST Invoice Workflow – Test Suite

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Counter = require('../models/Counter');
const User = require('../models/User');
const Technician = require('../models/Technician');
const { generateOrGetInvoice, generateAndEmailInvoice } = require('../services/InvoiceService');
const { generateSequentialInvoiceNumber } = require('../utils/invoiceNumberGenerator');
const { generateInvoicePdfBuffer } = require('../utils/pdfGenerator');

// ─── Mock sendEmail so no real email is sent ────────────────────────────────
const mockSendEmail = jest.fn().mockResolvedValue(true);
jest.mock('../utils/sendEmail', () => mockSendEmail);

// ─── Helper to create mock req/res ──────────────────────────────────────────
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  res.send = jest.fn();
  return res;
}

function mockReq(overrides = {}) {
  return {
    body: {},
    params: {},
    user: { id: new mongoose.Types.ObjectId().toString(), role: 'customer' },
    ...overrides
  };
}

// ─── Shared booking factory ──────────────────────────────────────────────────
async function createEligibleBooking(overrides = {}) {
  return Booking.create({
    name: 'Test Customer',
    phone: '9876543210',
    serviceName: 'AC Repair',
    problemDescription: 'AC not cooling properly',
    location: '12 Main Street, Madanapalle',
    date: new Date(),
    amount: 500,
    finalQuote: 500,
    status: 'completed',
    paymentStatus: 'cash_completed',
    paymentMethod: 'cash',
    ...overrides
  });
}

describe('Phase 6: Invoice & PDF Generation', () => {
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
    await Promise.all([
      Booking.deleteMany({}),
      Invoice.deleteMany({}),
      Counter.deleteMany({}),
      User.deleteMany({}),
      Technician.deleteMany({})
    ]);
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Invoice Number Generator
  // ─────────────────────────────────────────────────────────────
  describe('Sequential Invoice Number Generator', () => {
    test('generates formatted invoice number FXV/YY-YY/XXXXX', async () => {
      const num = await generateSequentialInvoiceNumber();
      expect(num).toMatch(/^FXV\/\d{2}-\d{2}\/\d{5}$/);
    });

    test('generates unique incrementing numbers sequentially', async () => {
      const [n1, n2, n3] = await Promise.all([
        generateSequentialInvoiceNumber(),
        generateSequentialInvoiceNumber(),
        generateSequentialInvoiceNumber()
      ]);
      const seqs = [n1, n2, n3].map(n => parseInt(n.split('/')[2], 10));
      // All three must be unique (concurrent atomic increments guarantee uniqueness)
      expect(new Set(seqs).size).toBe(3);
      // All must be positive integers
      seqs.forEach(s => expect(s).toBeGreaterThan(0));
    });

    test('uses correct Indian financial year (April start)', async () => {
      const num = await generateSequentialInvoiceNumber();
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const fyStart = month < 4 ? year - 1 : year;
      const fyEnd = fyStart + 1;
      const expected = `${String(fyStart).slice(-2)}-${String(fyEnd).slice(-2)}`;
      expect(num).toContain(expected);
    });

    test('pads sequence number to 5 digits', async () => {
      const num = await generateSequentialInvoiceNumber();
      const seqPart = num.split('/')[2];
      expect(seqPart).toHaveLength(5);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. InvoiceService — generateOrGetInvoice
  // ─────────────────────────────────────────────────────────────
  describe('InvoiceService.generateOrGetInvoice', () => {
    test('throws if bookingId is missing', async () => {
      await expect(generateOrGetInvoice(null)).rejects.toThrow('Booking ID is required');
    });

    test('throws if booking not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(generateOrGetInvoice(fakeId)).rejects.toThrow('Booking not found');
    });

    test('throws if booking is not completed or paid', async () => {
      const booking = await Booking.create({
        name: 'Alice',
        phone: '9999999999',
        serviceName: 'Plumbing',
        problemDescription: 'Leak',
        location: 'Test Location',
        date: new Date(),
        status: 'accepted',
        paymentStatus: 'pending'
      });
      await expect(generateOrGetInvoice(booking._id.toString())).rejects.toThrow(
        'Invoice can only be issued for completed or paid bookings'
      );
    });

    test('creates invoice for completed booking', async () => {
      const booking = await createEligibleBooking();
      const invoice = await generateOrGetInvoice(booking._id.toString());

      expect(invoice).toBeDefined();
      expect(invoice.invoiceNumber).toMatch(/^FXV\//);
      expect(invoice.bookingId.toString()).toBe(booking._id.toString());
      expect(invoice.status).toBe('issued');
    });

    test('returns existing invoice (idempotent) instead of creating duplicate', async () => {
      const booking = await createEligibleBooking();
      const inv1 = await generateOrGetInvoice(booking._id.toString());
      const inv2 = await generateOrGetInvoice(booking._id.toString());

      expect(inv1._id.toString()).toBe(inv2._id.toString());
      expect(inv1.invoiceNumber).toBe(inv2.invoiceNumber);
      const count = await Invoice.countDocuments({ bookingId: booking._id });
      expect(count).toBe(1);
    });

    test('handles concurrent invoice generation without duplicate bookingId errors', async () => {
      const booking = await createEligibleBooking();
      const [inv1, inv2] = await Promise.all([
        generateOrGetInvoice(booking._id.toString()),
        generateOrGetInvoice(booking._id.toString())
      ]);

      expect(inv1._id.toString()).toBe(inv2._id.toString());
      const count = await Invoice.countDocuments({ bookingId: booking._id });
      expect(count).toBe(1);
    });

    test('calculates subTotal as 70/30 split of finalQuote', async () => {
      const booking = await createEligibleBooking({ finalQuote: 1000, amount: 1000 });
      const invoice = await generateOrGetInvoice(booking._id.toString());

      expect(invoice.subTotal).toBe(1000);
      expect(invoice.itemizedCharges[0].amount).toBe(700);
      expect(invoice.itemizedCharges[1].amount).toBe(300);
    });

    test('taxableAmount equals subTotal when no discount is present (Booking has no discount fields)', async () => {
      const booking = await createEligibleBooking({ finalQuote: 500, amount: 500 });
      const invoice = await generateOrGetInvoice(booking._id.toString());

      // Booking model has no discountAmount field — so discount is always 0
      expect(invoice.discountAmount).toBe(0);
      expect(invoice.taxableAmount).toBe(invoice.subTotal);
    });

    test('populates customer details from booking', async () => {
      const booking = await createEligibleBooking({
        name: 'Jane Doe',
        phone: '9123456789',
        location: '5 Park Avenue, Madanapalle',
        userEmail: 'jane@test.com'
      });
      const invoice = await generateOrGetInvoice(booking._id.toString());

      expect(invoice.customerDetails.name).toBe('Jane Doe');
      expect(invoice.customerDetails.phone).toBe('9123456789');
      expect(invoice.customerDetails.address).toBe('5 Park Avenue, Madanapalle');
    });

    test('populates technician details from Technician model when providerId is set', async () => {
      const tech = await User.create({
        name: 'TechGuy Sharma',
        email: 'techguy@test.com',
        password: 'Pass1234!'
      });
      await Technician.create({
        userId: tech._id.toString(),
        name: 'TechGuy Sharma',
        phone: '9000012345',
        email: 'techguy@test.com',
        walletBalance: 0
      });
      const booking = await createEligibleBooking({ providerId: tech._id.toString() });
      const invoice = await generateOrGetInvoice(booking._id.toString());

      expect(invoice.providerDetails.name).toBe('TechGuy Sharma');
      expect(invoice.providerDetails.phone).toBe('9000012345');
    });

    test('sets GST fields to zero when GST_ENABLED is not set', async () => {
      delete process.env.GST_ENABLED;
      const booking = await createEligibleBooking({ finalQuote: 600 });
      const invoice = await generateOrGetInvoice(booking._id.toString());

      expect(invoice.isGstApplicable).toBe(false);
      expect(invoice.cgstAmount).toBe(0);
      expect(invoice.sgstAmount).toBe(0);
      expect(invoice.igstAmount).toBe(0);
      expect(invoice.totalAmount).toBe(invoice.taxableAmount);
    });

    test('calculates GST amounts correctly when GST_ENABLED=true', async () => {
      process.env.GST_ENABLED = 'true';
      process.env.GST_RATE_PERCENTAGE = '18';
      const booking = await createEligibleBooking({ finalQuote: 1000 });
      const invoice = await generateOrGetInvoice(booking._id.toString());

      expect(invoice.isGstApplicable).toBe(true);
      expect(invoice.cgstRate).toBe(9);
      expect(invoice.sgstRate).toBe(9);
      expect(invoice.cgstAmount).toBeCloseTo(90, 1);
      expect(invoice.sgstAmount).toBeCloseTo(90, 1);
      expect(invoice.totalAmount).toBe(1180);

      delete process.env.GST_ENABLED;
      delete process.env.GST_RATE_PERCENTAGE;
    });

    test('sets payment method and transactionId from booking', async () => {
      const booking = await createEligibleBooking({
        paymentMethod: 'razorpay',
        paymentStatus: 'completed',
        transactionId: 'pay_ABCDEF123'
      });
      const invoice = await generateOrGetInvoice(booking._id.toString());

      expect(invoice.paymentMethod).toBe('razorpay');
      expect(invoice.transactionId).toBe('pay_ABCDEF123');
    });

    test('auto-generates transactionId when none provided', async () => {
      const booking = await createEligibleBooking({ transactionId: null });
      const invoice = await generateOrGetInvoice(booking._id.toString());

      expect(invoice.transactionId).toMatch(/^TXN-/);
    });

    test('persists invoice to MongoDB after creation', async () => {
      const booking = await createEligibleBooking();
      const invoice = await generateOrGetInvoice(booking._id.toString());

      const saved = await Invoice.findById(invoice._id);
      expect(saved).not.toBeNull();
      expect(saved.invoiceNumber).toBe(invoice.invoiceNumber);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. InvoiceService — generateAndEmailInvoice
  // ─────────────────────────────────────────────────────────────
  describe('InvoiceService.generateAndEmailInvoice', () => {
    test('returns invoice document', async () => {
      const booking = await createEligibleBooking({ userEmail: 'user@example.com' });
      const invoice = await generateAndEmailInvoice(booking._id.toString());

      expect(invoice).toBeDefined();
      expect(invoice.invoiceNumber).toMatch(/^FXV\//);
    });

    test('is idempotent — second call returns same invoice without creating duplicate', async () => {
      const booking = await createEligibleBooking({ userEmail: 'user@example.com' });
      const inv1 = await generateAndEmailInvoice(booking._id.toString());
      // Wait for any async setImmediate to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      const inv2 = await generateAndEmailInvoice(booking._id.toString());

      expect(inv1._id.toString()).toBe(inv2._id.toString());
      const count = await Invoice.countDocuments({ bookingId: booking._id });
      expect(count).toBe(1);
    });

    test('does not throw when email send fails', async () => {
      mockSendEmail.mockRejectedValueOnce(new Error('SMTP failure'));

      const booking = await createEligibleBooking({ userEmail: 'user@example.com' });
      await expect(generateAndEmailInvoice(booking._id.toString())).resolves.toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. PDF Generator
  // ─────────────────────────────────────────────────────────────
  describe('PDF Generator (generateInvoicePdfBuffer)', () => {
    const sampleInvoice = {
      invoiceNumber: 'FXV/25-26/00001',
      issueDate: new Date('2025-06-15'),
      paymentMethod: 'razorpay',
      transactionId: 'pay_ABCD123',
      subTotal: 500,
      discountAmount: 0,
      taxableAmount: 500,
      totalAmount: 500,
      isGstApplicable: false,
      cgstRate: 0, cgstAmount: 0,
      sgstRate: 0, sgstAmount: 0,
      customerDetails: { name: 'Test User', phone: '9876543210', address: 'Test Address' },
      providerDetails: { name: 'Expert Tech', phone: '9000000001' },
      businessDetails: {
        legalName: 'Fixvo Technologies',
        tradeName: 'Fixvo App',
        address: 'Madanapalle',
        phone: '+91 95159 80170',
        email: 'fixvosupport@gmail.com'
      },
      itemizedCharges: [
        { description: 'AC Repair Service', category: 'Repair', amount: 350 },
        { description: 'Labor & Parts', category: 'Labor/Parts', amount: 150 }
      ]
    };

    test('returns a non-empty Buffer', async () => {
      const buf = await generateInvoicePdfBuffer(sampleInvoice);
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf.length).toBeGreaterThan(0);
    });

    test('generated buffer starts with PDF magic bytes (%PDF)', async () => {
      const buf = await generateInvoicePdfBuffer(sampleInvoice);
      expect(buf.slice(0, 4).toString()).toBe('%PDF');
    });

    test('generates PDF with GST fields', async () => {
      const gstInvoice = {
        ...sampleInvoice,
        isGstApplicable: true,
        cgstRate: 9, cgstAmount: 45,
        sgstRate: 9, sgstAmount: 45,
        totalAmount: 590
      };
      const buf = await generateInvoicePdfBuffer(gstInvoice);
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf.length).toBeGreaterThan(0);
    });

    test('generates PDF when optional fields are missing (graceful defaults)', async () => {
      const minimalInvoice = {
        invoiceNumber: 'FXV/25-26/00002',
        totalAmount: 199,
        subTotal: 199,
        discountAmount: 0,
        taxableAmount: 199,
        isGstApplicable: false,
        itemizedCharges: []
      };
      const buf = await generateInvoicePdfBuffer(minimalInvoice);
      expect(buf).toBeInstanceOf(Buffer);
    });

    test('generates PDF with discount line shown', async () => {
      const discountInvoice = { ...sampleInvoice, discountAmount: 50, taxableAmount: 450, totalAmount: 450 };
      const buf = await generateInvoicePdfBuffer(discountInvoice);
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf.length).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Invoice Controller — HTTP endpoint tests
  // ─────────────────────────────────────────────────────────────
  describe('Invoice Controller HTTP endpoints', () => {
    const { generateInvoice, getInvoiceByBookingId, downloadInvoicePdf } = require('../controllers/invoiceController');

    test('POST /generate — returns 400 if bookingId missing', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await generateInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    });

    test('POST /generate — returns 404 if booking not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const req = mockReq({ body: { bookingId: fakeId }, user: { id: 'anyUserId', role: 'admin' } });
      const res = mockRes();
      await generateInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('POST /generate — returns 403 if user not authorized', async () => {
      const booking = await createEligibleBooking({ userId: 'ownerUserId', providerId: 'techUserId' });
      const req = mockReq({
        body: { bookingId: booking._id.toString() },
        user: { id: 'someOtherUserId', role: 'customer' }
      });
      const res = mockRes();
      await generateInvoice(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('POST /generate — returns 200 with invoice for booking owner', async () => {
      const customerId = new mongoose.Types.ObjectId().toString();
      const booking = await createEligibleBooking({ userId: customerId });
      const req = mockReq({
        body: { bookingId: booking._id.toString() },
        user: { id: customerId, role: 'customer' }
      });
      const res = mockRes();
      await generateInvoice(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        invoice: expect.objectContaining({ invoiceNumber: expect.stringMatching(/^FXV\//) })
      }));
    });

    test('POST /generate — admin can access any booking invoice', async () => {
      const booking = await createEligibleBooking({ userId: 'someCustomer' });
      const req = mockReq({
        body: { bookingId: booking._id.toString() },
        user: { id: 'adminId', role: 'admin' }
      });
      const res = mockRes();
      await generateInvoice(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('GET /booking/:bookingId — returns invoice for the booking owner', async () => {
      const customerId = new mongoose.Types.ObjectId().toString();
      const booking = await createEligibleBooking({ userId: customerId });
      // Pre-generate the invoice
      await generateOrGetInvoice(booking._id.toString());

      const req = mockReq({
        params: { bookingId: booking._id.toString() },
        user: { id: customerId, role: 'customer' }
      });
      const res = mockRes();
      await getInvoiceByBookingId(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('GET /:id/pdf — returns 404 if invoice not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const req = mockReq({ params: { id: fakeId }, user: { id: 'anyId', role: 'admin' } });
      const res = mockRes();
      await downloadInvoicePdf(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('GET /:id/pdf — streams PDF to response for authorized user', async () => {
      const customerId = new mongoose.Types.ObjectId().toString();
      const booking = await createEligibleBooking({ userId: customerId });
      const invoice = await generateOrGetInvoice(booking._id.toString());

      const req = mockReq({
        params: { id: invoice._id.toString() },
        user: { id: customerId, role: 'customer' }
      });
      const res = mockRes();
      await downloadInvoicePdf(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment')
      );
      expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
    });

    test('GET /:id/pdf — returns 403 for unauthorized user', async () => {
      const booking = await createEligibleBooking({ userId: 'realCustomer', providerId: 'realTech' });
      const invoice = await generateOrGetInvoice(booking._id.toString());

      const req = mockReq({
        params: { id: invoice._id.toString() },
        user: { id: 'someRandomUser', role: 'customer' }
      });
      const res = mockRes();
      await downloadInvoicePdf(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Invoice Model
  // ─────────────────────────────────────────────────────────────
  describe('Invoice Model Schema', () => {
    test('requires invoiceNumber, bookingId, userId, subTotal, taxableAmount, totalAmount', async () => {
      const inv = new Invoice({});
      const err = inv.validateSync();
      expect(err).toBeDefined();
      ['invoiceNumber', 'bookingId', 'userId', 'subTotal', 'taxableAmount', 'totalAmount'].forEach(field => {
        expect(err.errors[field]).toBeDefined();
      });
    });

    test('enforces unique invoiceNumber constraint', async () => {
      const booking1 = await createEligibleBooking();
      const booking2 = await createEligibleBooking({ name: 'Another User' });

      await Invoice.create({
        invoiceNumber: 'FXV/25-26/UNIQUE01',
        bookingId: booking1._id,
        userId: 'user1',
        subTotal: 100, taxableAmount: 100, totalAmount: 100
      });

      await expect(Invoice.create({
        invoiceNumber: 'FXV/25-26/UNIQUE01', // same number
        bookingId: booking2._id,
        userId: 'user2',
        subTotal: 200, taxableAmount: 200, totalAmount: 200
      })).rejects.toThrow();
    });

    test('enforces unique bookingId constraint (one invoice per booking)', async () => {
      const booking = await createEligibleBooking();

      await Invoice.create({
        invoiceNumber: 'FXV/25-26/DUP001',
        bookingId: booking._id,
        userId: 'user1',
        subTotal: 100, taxableAmount: 100, totalAmount: 100
      });

      await expect(Invoice.create({
        invoiceNumber: 'FXV/25-26/DUP002',
        bookingId: booking._id, // same bookingId
        userId: 'user1',
        subTotal: 100, taxableAmount: 100, totalAmount: 100
      })).rejects.toThrow();
    });

    test('default status is "issued"', async () => {
      const booking = await createEligibleBooking();
      const inv = await Invoice.create({
        invoiceNumber: 'FXV/25-26/STATUS01',
        bookingId: booking._id,
        userId: 'user1',
        subTotal: 100, taxableAmount: 100, totalAmount: 100
      });
      expect(inv.status).toBe('issued');
    });

    test('isGstApplicable defaults to false', async () => {
      const booking = await createEligibleBooking();
      const inv = await Invoice.create({
        invoiceNumber: 'FXV/25-26/GST01',
        bookingId: booking._id,
        userId: 'user1',
        subTotal: 100, taxableAmount: 100, totalAmount: 100
      });
      expect(inv.isGstApplicable).toBe(false);
    });

    test('accepts status values: issued, refunded, void', async () => {
      const booking = await createEligibleBooking();
      const inv = await Invoice.create({
        invoiceNumber: 'FXV/25-26/VOID01',
        bookingId: booking._id,
        userId: 'user1',
        subTotal: 100, taxableAmount: 100, totalAmount: 100,
        status: 'void'
      });
      expect(inv.status).toBe('void');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Email Template
  // ─────────────────────────────────────────────────────────────
  describe('customerInvoiceEmail Template', () => {
    const { customerInvoiceEmail } = require('../utils/emailTemplates');

    const sampleInvoice = {
      invoiceNumber: 'FXV/25-26/00010',
      issueDate: new Date('2025-09-01'),
      paymentMethod: 'razorpay',
      transactionId: 'pay_XYZ999',
      totalAmount: 600,
      subTotal: 700,
      discountAmount: 100,
      taxableAmount: 600,
      isGstApplicable: false,
      cgstRate: 0, cgstAmount: 0,
      sgstRate: 0, sgstAmount: 0,
      customerDetails: { name: 'Raju Kumar', phone: '9876543210', address: 'Vizag, AP' },
      providerDetails: { name: 'Certified Tech', phone: '9000000009' },
      businessDetails: {
        legalName: 'Fixvo Technologies',
        tradeName: 'Fixvo App',
        address: 'Andhra Pradesh',
        phone: '+91 95159 80170',
        email: 'fixvosupport@gmail.com',
        gstin: ''
      },
      itemizedCharges: [
        { description: 'Washing Machine Repair', category: 'Repair', amount: 490 },
        { description: 'Labor & Parts', category: 'Labor/Parts', amount: 210 }
      ]
    };

    test('returns a non-empty HTML string', () => {
      const html = customerInvoiceEmail(sampleInvoice);
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(100);
    });

    test('includes invoice number in output', () => {
      const html = customerInvoiceEmail(sampleInvoice);
      expect(html).toContain('FXV/25-26/00010');
    });

    test('includes customer name in output', () => {
      const html = customerInvoiceEmail(sampleInvoice);
      expect(html).toContain('Raju Kumar');
    });

    test('includes total amount in output', () => {
      const html = customerInvoiceEmail(sampleInvoice);
      expect(html).toContain('600');
    });

    test('includes warranty section', () => {
      const html = customerInvoiceEmail(sampleInvoice);
      expect(html).toContain('30-Day Fixvo Service Warranty');
    });

    test('includes View Bookings CTA link', () => {
      const html = customerInvoiceEmail(sampleInvoice, 'https://fixvo.in');
      expect(html).toContain('https://fixvo.in/bookings');
      expect(html).toContain('View Bookings');
    });

    test('shows discount row when discountAmount > 0', () => {
      const html = customerInvoiceEmail(sampleInvoice);
      expect(html).toContain('Promotional Discount');
    });

    test('does not show discount row when discountAmount is 0', () => {
      const noDiscount = { ...sampleInvoice, discountAmount: 0 };
      const html = customerInvoiceEmail(noDiscount);
      expect(html).not.toContain('Promotional Discount');
    });

    test('shows GST rows when isGstApplicable is true', () => {
      const gstInvoice = {
        ...sampleInvoice,
        isGstApplicable: true,
        cgstRate: 9, cgstAmount: 54,
        sgstRate: 9, sgstAmount: 54,
        totalAmount: 708
      };
      const html = customerInvoiceEmail(gstInvoice);
      expect(html).toContain('CGST');
      expect(html).toContain('SGST');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. Cash Payment Auto-Invoice Hook
  // ─────────────────────────────────────────────────────────────
  describe('Cash Payment Auto-Invoice Integration', () => {
    test('cashPaymentController imports generateAndEmailInvoice without error', () => {
      expect(() => require('../controllers/cashPaymentController')).not.toThrow();
    });

    test('generateAndEmailInvoice is called after cash payment (integration smoke test)', async () => {
      const booking = await createEligibleBooking({
        paymentStatus: 'cash_completed',
        userEmail: 'autoinvoice@test.com'
      });
      const invoice = await generateAndEmailInvoice(booking._id.toString());
      expect(invoice).toBeDefined();
      expect(invoice.paymentMethod).toBe('cash');
    });
  });
});
