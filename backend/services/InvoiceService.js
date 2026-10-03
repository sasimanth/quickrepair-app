const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Technician = require('../models/Technician');
const { generateSequentialInvoiceNumber } = require('../utils/invoiceNumberGenerator');

/**
 * Creates or retrieves an existing invoice for a completed booking (Idempotent)
 * @param {string} bookingId
 * @returns {Promise<object>} Invoice document
 */
async function generateOrGetInvoice(bookingId) {
  if (!bookingId) {
    throw new Error('Booking ID is required for invoice generation');
  }

  // 1. Idempotency Check: Return existing invoice if already issued
  const existingInvoice = await Invoice.findOne({ bookingId });
  if (existingInvoice) {
    return existingInvoice;
  }

  // 2. Fetch booking details
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  // Verify booking is eligible for invoice (must be completed or paid)
  const isPaidOrCompleted = 
    booking.status === 'completed' || 
    ['completed', 'cash_completed'].includes(booking.paymentStatus);

  if (!isPaidOrCompleted) {
    throw new Error('Invoice can only be issued for completed or paid bookings');
  }

  // Fetch technician profile if assigned
  let techName = 'Certified Fixvo Expert';
  let techPhone = booking.providerPhone || '+91 95159 80170';
  let techEmail = booking.providerEmail || '';
  if (booking.providerId) {
    const techDoc = await Technician.findOne({ userId: booking.providerId });
    if (techDoc) {
      techName = techDoc.name;
      techPhone = techDoc.phone || techPhone;
      techEmail = techDoc.email || techEmail;
    }
  }

  // 3. Itemized Charges Calculation
  const totalPaid = Number(booking.finalQuote || booking.amount || 199);
  const discountAmount = Number(booking.discountAmount || (booking.discountPercentage ? (totalPaid * (booking.discountPercentage / 100)) : 0));
  
  // Base breakdown
  const baseServiceFee = Math.round(totalPaid * 0.70);
  const partsOrLabor = Math.round(totalPaid * 0.30);
  const subTotal = baseServiceFee + partsOrLabor;
  const taxableAmount = Math.max(0, subTotal - discountAmount);

  // GST Calculation (Conditional: Controlled by GST_ENABLED env flag)
  const isGstEnabled = process.env.GST_ENABLED === 'true';
  const gstRate = isGstEnabled ? Number(process.env.GST_RATE_PERCENTAGE || 18) : 0;
  
  let cgstRate = 0, cgstAmount = 0;
  let sgstRate = 0, sgstAmount = 0;
  let igstRate = 0, igstAmount = 0;

  if (isGstEnabled && gstRate > 0) {
    // Default intra-state calculation: 9% CGST + 9% SGST
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = Math.round((taxableAmount * (cgstRate / 100)) * 100) / 100;
    sgstAmount = Math.round((taxableAmount * (sgstRate / 100)) * 100) / 100;
  }

  const grandTotal = Math.round(taxableAmount + cgstAmount + sgstAmount + igstAmount);

  // Generate unique sequential invoice number
  const invoiceNumber = await generateSequentialInvoiceNumber();

  const itemizedCharges = [
    {
      description: `${booking.serviceName || 'Home Repair Service'} - ${booking.problemDescription || 'Standard diagnosis & repair'}`,
      category: booking.serviceOption || 'Repair',
      amount: baseServiceFee
    }
  ];

  if (partsOrLabor > 0) {
    itemizedCharges.push({
      description: 'Labor, Diagnostics & Accessories Adjustment',
      category: 'Labor/Parts',
      amount: partsOrLabor
    });
  }

  const invoiceData = {
    invoiceNumber,
    bookingId: booking._id,
    userId: booking.userId || 'guest_user',
    providerId: booking.providerId || null,
    issueDate: booking.updatedAt || new Date(),
    customerDetails: {
      name: booking.name || 'Valued Customer',
      phone: booking.phone || '',
      email: booking.userEmail || '',
      address: booking.location || 'Service Location'
    },
    providerDetails: {
      name: techName,
      phone: techPhone,
      email: techEmail,
      companyName: 'Fixvo Certified Partner'
    },
    businessDetails: {
      legalName: process.env.BUSINESS_LEGAL_NAME || 'Fixvo Technologies',
      tradeName: process.env.BUSINESS_TRADE_NAME || 'Fixvo App',
      address: process.env.BUSINESS_ADDRESS || 'Madanapalle & Region, Andhra Pradesh, India',
      phone: process.env.BUSINESS_PHONE || '+91 95159 80170',
      email: process.env.BUSINESS_EMAIL || 'fixvosupport@gmail.com',
      gstin: process.env.FIXVO_GSTIN || '',
      sacCode: process.env.GST_SAC_CODE || '998719'
    },
    itemizedCharges,
    subTotal,
    discountAmount,
    taxableAmount,
    isGstApplicable: isGstEnabled,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalAmount: grandTotal,
    paymentMethod: booking.paymentMethod || 'cash',
    paymentStatus: booking.paymentStatus || 'completed',
    transactionId: booking.transactionId || `TXN-${booking._id.toString().slice(-8).toUpperCase()}`,
    status: 'issued'
  };

  const invoice = new Invoice(invoiceData);

  try {
    return await invoice.save();
  } catch (saveErr) {
    if (saveErr?.code === 11000 || /duplicate key/i.test(saveErr?.message || '')) {
      const recoveredInvoice = await Invoice.findOne({ bookingId }).lean();
      if (recoveredInvoice) {
        return recoveredInvoice;
      }
    }
    throw saveErr;
  }
}

/**
 * Generates (or retrieves) invoice for a booking and sends it via email.
 * Silently swallows email errors to avoid failing the payment response.
 * @param {string} bookingId
 * @returns {Promise<object>} Invoice document
 */
async function generateAndEmailInvoice(bookingId) {
  const invoice = await generateOrGetInvoice(bookingId);

  // Send invoice email asynchronously — don't block payment response
  setImmediate(async () => {
    try {
      const customerEmail = invoice.customerDetails?.email;
      if (!customerEmail) return;

      // Try to get email from User model as fallback
      let emailTo = customerEmail;
      if (!emailTo && invoice.userId) {
        const user = await User.findById(invoice.userId).select('email').lean();
        emailTo = user?.email;
      }
      if (!emailTo) return;

      const { customerInvoiceEmail } = require('../utils/emailTemplates');
      const sendEmail = require('../utils/sendEmail');
      const appUrl = process.env.FRONTEND_URL || 'https://fixvo.in';

      await sendEmail({
        to: emailTo,
        subject: `Fixvo Invoice ${invoice.invoiceNumber} – Payment Confirmed ✅`,
        html: customerInvoiceEmail(invoice, appUrl)
      });
    } catch (emailErr) {
      // Non-critical: log but don't throw
      console.error('[InvoiceService] Invoice email send failed (non-critical):', emailErr.message);
    }
  });

  return invoice;
}

module.exports = { generateOrGetInvoice, generateAndEmailInvoice };

