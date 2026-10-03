const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const { generateOrGetInvoice } = require('../services/InvoiceService');
const { generateInvoicePdfBuffer } = require('../utils/pdfGenerator');

// @desc    Generate or get invoice for a booking (Idempotent)
// @route   POST /api/invoices/generate
const generateInvoice = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId parameter is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Access authorization check: user must be customer, provider, or admin
    const isCustomer = booking.userId && booking.userId.toString() === req.user.id.toString();
    const isProvider = booking.providerId && booking.providerId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to access invoice for this booking' });
    }

    const invoice = await generateOrGetInvoice(bookingId);
    res.status(200).json({ success: true, invoice });
  } catch (err) {
    console.error('Error generating invoice:', err);
    res.status(400).json({ message: err.message });
  }
};

// @desc    Get invoice details by booking ID
// @route   GET /api/invoices/booking/:bookingId
const getInvoiceByBookingId = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Access authorization check
    const isCustomer = booking.userId && booking.userId.toString() === req.user.id.toString();
    const isProvider = booking.providerId && booking.providerId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to access invoice for this booking' });
    }

    const invoice = await generateOrGetInvoice(bookingId);
    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Download PDF invoice stream
// @route   GET /api/invoices/:id/pdf
const downloadInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Authorization check
    const isCustomer = invoice.userId && invoice.userId.toString() === req.user.id.toString();
    const isProvider = invoice.providerId && invoice.providerId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to download this invoice PDF' });
    }

    const pdfBuffer = await generateInvoicePdfBuffer(invoice);

    const safeFilename = `${invoice.invoiceNumber.replace(/[\/\\]/g, '_')}_receipt.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF stream:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  generateInvoice,
  getInvoiceByBookingId,
  downloadInvoicePdf
};
