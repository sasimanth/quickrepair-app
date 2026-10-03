const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const { generateAndEmailInvoice } = require('../services/InvoiceService');

/**
 * Technician confirms cash collection for a booking.
 *
 * Expected body:
 *   - bookingId: string (MongoDB ObjectId)
 *   - amount: number (cash received)
 *
 * Responses:
 *   200 - success, returns updated booking
 *   400 - validation errors (missing/invalid amount, state mismatch)
 *   403 - unauthorized (technician not assigned)
 *   404 - booking not found
 */
exports.confirmCashPayment = async (req, res) => {
  try {
    const techId = req.user.id; // technician id from auth middleware
    const { bookingId, amount } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId is required' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Valid cash amount is required' });
    }

    // Fetch booking to validate amount and other constraints
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.providerId?.toString() !== techId.toString()) {
      return res.status(403).json({ message: 'Technician not assigned to this booking' });
    }
    if (booking.paymentStatus !== 'cash_pending') {
      return res.status(400).json({ message: `Invalid payment state: ${booking.paymentStatus}` });
    }
    if (booking.cashCollectedAt) {
      return res.status(400).json({ message: 'Cash payment already confirmed' });
    }
    // Validate received amount matches expected booking amount (or finalQuote if amount not set)
    const expectedAmount = booking.amount || booking.finalQuote || 0;
    if (amount !== expectedAmount) {
      return res.status(400).json({ message: `Cash amount mismatch. Expected ${expectedAmount}` });
    }

    // Atomic conditional update
    const updated = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        paymentStatus: 'cash_pending',
        providerId: techId,
        cashCollectedAt: null
      },
      {
        $set: {
          paymentStatus: 'cash_completed',
          cashCollectedAt: new Date(),
          cashCollectedBy: techId,
          cashAmount: amount,
          paymentMethod: 'cash'
        }
      },
      { new: true }
    ).populate('serviceId', 'name price');

    if (!updated) {
      // Should not happen due to prior checks, but fallback error
      return res.status(400).json({ message: 'Unable to confirm cash payment' });
    }

    // Auto-generate invoice and email to customer (fire-and-forget, non-blocking)
    generateAndEmailInvoice(bookingId).catch(err =>
      console.error('[cashPayment] Invoice generation failed (non-critical):', err.message)
    );

    return res.json(updated);
  } catch (err) {
    console.error('Error confirming cash payment', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
