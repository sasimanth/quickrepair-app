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
    if (booking.paymentStatus !== 'cash_pending' && booking.paymentStatus !== 'awaiting_payment' && booking.paymentStatus !== 'pending') {
      if (booking.cashCollectedAt || booking.paymentStatus === 'cash_completed') {
        return res.status(400).json({ message: 'Cash payment already confirmed' });
      }
    }

    // Atomic conditional update
    const updated = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        providerId: techId
      },
      {
        $set: {
          status: 'completed',
          paymentStatus: 'cash_completed',
          cashCollectedAt: new Date(),
          cashCollectedBy: techId,
          cashAmount: amount,
          paymentMethod: 'cash',
          amount: amount
        }
      },
      { new: true }
    ).populate('serviceId', 'name price');

    if (!updated) {
      return res.status(400).json({ message: 'Unable to confirm cash payment' });
    }

    // Award 100 Fixvo Loyalty Reward Points to customer
    if (updated.userId) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(updated.userId, { $inc: { rewardPoints: 100 } }).catch(e => console.warn('Reward points error:', e.message));
    }

    // Credit/update technician wallet
    const { updateTechnicianWallet, triggerNotifications } = require('./bookingController');
    if (updateTechnicianWallet) {
      await updateTechnicianWallet(updated).catch(e => console.warn('Wallet update error:', e.message));
    }
    if (triggerNotifications) {
      await triggerNotifications(req, updated, 'payment_completed').catch(e => console.warn('Trigger notif error:', e.message));
    }

    // Real-time socket update for instant timeline green checkmark
    if (global.io) {
      if (updated.userId) global.io.to(`user_${updated.userId}`).emit('job_update', updated.toObject ? updated.toObject() : updated);
      if (updated.providerId) global.io.to(`user_${updated.providerId}`).emit('job_update', updated.toObject ? updated.toObject() : updated);
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
