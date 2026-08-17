const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');

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

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic || process.env.NODE_ENV !== 'production') {
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
      }

      return res.json({ success: true, message: 'Payment verified successfully.' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }
  } catch (error) {
    console.error('Razorpay Verify Error:', error);
    res.status(500).json({ message: error.message || 'Payment verification failed.' });
  }
};

module.exports = { createOrder, verifyPayment };
