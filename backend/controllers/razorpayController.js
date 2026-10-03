const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const { generateAndEmailInvoice } = require('../services/InvoiceService');
const Sentry = require('@sentry/node');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_FIXVO123',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'fixvoSecret123'
});

// @desc    Create Razorpay Order for Booking Checkout
// @route   POST /api/payments/razorpay/create-order
const createOrder = async (req, res) => {
  const { bookingId, amount } = req.body;
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const numAmount = amount || booking.finalQuote || booking.amount || 199;
    const amountInPaise = Math.round(Number(numAmount) * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${booking._id.toString().slice(-8)}`,
      notes: {
        bookingId: booking._id.toString(),
        customerName: booking.name,
        serviceName: booking.serviceName
      }
    };

    const order = await razorpay.orders.create(options);
    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_FIXVO123'
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    Sentry.captureException(error, {
      tags: { subsystem: 'payment', gateway: 'razorpay', operation: 'createOrder' },
      extra: { bookingId } // never include keys/secrets
    });
    res.status(500).json({ message: error.message || 'Payment order creation failed.' });
  }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/payments/razorpay/verify
const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'fixvoSecret123';
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    // Use timing-safe comparison for signature verification
    const isAuthentic = crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

    if (isAuthentic) {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.paymentStatus = 'completed';
        booking.paymentMethod = 'razorpay';
        booking.transactionId = razorpay_payment_id || `tx_rzp_${Date.now()}`;
        await booking.save();

        if (booking.providerId) {
          const Technician = require('../models/Technician');
          const tech = await Technician.findOne({ userId: booking.providerId });
          if (tech) {
            tech.walletBalance = (tech.walletBalance || 0) + (booking.finalQuote || booking.amount || 0);
            await tech.save();
          }
        }

        // Reward customer 10% loyalty points on completed payment
        if (booking.userId) {
          try {
            const User = require('../models/User');
            const customer = await User.findById(booking.userId);
            if (customer) {
              const pointsEarned = Math.round((booking.finalQuote || booking.amount || 0) * 0.10);
              customer.rewardPoints = (customer.rewardPoints || 0) + pointsEarned;
              await customer.save();
            }
          } catch (e) {}
        }
      }

        // Auto-generate invoice and email to customer (fire-and-forget)
        generateAndEmailInvoice(bookingId).catch(err =>
          console.error('[razorpay] Invoice generation failed (non-critical):', err.message)
        );

        return res.json({ success: true, message: 'Payment verified successfully.' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }
  } catch (error) {
    console.error('Razorpay Verify Error:', error);
    Sentry.captureException(error, {
      tags: { subsystem: 'payment', gateway: 'razorpay', operation: 'verifyPayment' },
      extra: { bookingId } // never include razorpay_signature or razorpay_payment_id
    });
    res.status(500).json({ message: error.message || 'Payment verification failed.' });
  }
};
// @desc    Handle Razorpay Webhook Events
// @route   POST /api/payments/razorpay/webhook
const RazorpayEvent = require('../models/RazorpayEvent');
const transactionSupport = require('../utils/transactionSupport');
const handleWebhook = async (req, res) => {
  // Ensure webhook secret is configured
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error('RAZORPAY_WEBHOOK_SECRET not set');
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const payload = req.rawBody; // Buffer from rawBody middleware

  // Verify signature using timing-safe comparison
  const expected = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
  if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  let event;
  try {
    event = JSON.parse(payload.toString());
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
  }

// Use transaction for atomic processing
  try {
    let processedBooking = null;
    await transactionSupport.withTransaction(async (session) => {
      // Idempotency: attempt to create event doc; if duplicate, skip processing
      const eventDoc = new RazorpayEvent({ eventId: event.id, eventType: event.event, rawPayload: event });
      let isDuplicate = false;
      try {
        await eventDoc.save({ session });
      } catch (err) {
        if (err.code === 11000) {
          // Duplicate event – skip processing
          isDuplicate = true;
        } else {
          throw err;
        }
      }
      if (isDuplicate) return;

      // Extract bookingId from Razorpay payload
      const bookingId = event.payload?.payment?.entity?.notes?.bookingId || event.payload?.order?.entity?.receipt?.split('_')[1] || event.payload?.refund?.entity?.notes?.bookingId;
      if (!bookingId) {
        // No associated booking; ignore the event safely
        return res.status(200).json({ success: true, message: 'No booking ID found, ignored.' });
      }

      let booking;
if (session) {
  booking = await Booking.findById(bookingId).session(session);
} else {
  booking = await Booking.findById(bookingId);
}
      if (!booking) {
        throw new Error('Booking not found');
      }

      const eventType = event.event;
      switch (eventType) {
        case 'payment.captured': {
          if (booking.transactionId && booking.transactionId === event.payload.payment.entity.id) {
            processedBooking = booking;
            break; // already processed
          }
          booking.paymentStatus = 'completed';
          booking.paymentMethod = 'razorpay';
          booking.transactionId = event.payload.payment.entity.id;
          if (session) {
  await booking.save({ session });
} else {
  await booking.save();
}

          if (booking.providerId) {
            const Technician = require('../models/Technician');
            let tech;
if (session) {
  tech = await Technician.findOne({ userId: booking.providerId }).session(session);
} else {
  tech = await Technician.findOne({ userId: booking.providerId });
}
            if (tech && !booking.walletUpdated) {
              tech.walletBalance = (tech.walletBalance || 0) + (booking.finalQuote || booking.amount || 0);
              if (session) {
  if (session) {
  await tech.save({ session });
} else {
  await tech.save();
}
} else {
  await tech.save();
}
              booking.walletUpdated = true;
              await booking.save({ session });
            }
          }

          if (booking.userId) {
            try {
              const User = require('../models/User');
              const customer = await User.findById(booking.userId).session(session);
              if (customer) {
                const pointsEarned = Math.round((booking.finalQuote || booking.amount || 0) * 0.10);
                customer.rewardPoints = (customer.rewardPoints || 0) + pointsEarned;
                if (session) {
  if (session) {
  await customer.save({ session });
} else {
  await customer.save();
}
} else {
  await customer.save();
}
              }
            } catch (e) {}
          }
          processedBooking = booking;
          break;
        }
        case 'payment.failed': {
          if (!['completed', 'refunded'].includes(booking.paymentStatus)) {
            booking.paymentStatus = 'failed';
            if (session) {
  await booking.save({ session });
} else {
  await booking.save();
}
            processedBooking = booking;
          }
          break;
        }
        case 'refund.processed': {
          if (booking.paymentStatus === 'completed') {
            booking.paymentStatus = 'refunded';
            if (session) {
  await booking.save({ session });
} else {
  await booking.save();
}
            processedBooking = booking;
          }
          break;
        }
        default:
          break;
      }

      // Send notifications after transaction commit
      if (processedBooking) {
        try {
          const { triggerNotifications } = require('../controllers/bookingController');
          if (triggerNotifications) {
            await triggerNotifications(req, processedBooking, event.event);
          }
        } catch (e) {}
      }
    });
  } catch (err) {
    console.error('Webhook processing error:', err);
    Sentry.captureException(err, {
      tags: { subsystem: 'payment', gateway: 'razorpay', operation: 'webhook' }
      // No payload data — may contain raw payment body
    });
    return res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }

  return res.json({ success: true, message: 'Webhook processed' });

  // duplicate return removed
};

module.exports = { createOrder, verifyPayment, handleWebhook };
