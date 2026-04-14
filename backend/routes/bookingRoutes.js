const express = require('express');
const router = express.Router();
const { createBooking, getBookings, updateBookingStatus, assignBooking, processPayment, createPaymentIntent, submitQuote, approveQuote } = require('../controllers/bookingController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.route('/')
  .post(optionalAuth, createBooking)
  .get(protect, getBookings); // Controller handles logic based on role

router.put('/:id/status', protect, authorize('user', 'technician', 'admin'), updateBookingStatus);
router.put('/:id/assign', protect, authorize('admin'), assignBooking);
router.put('/:id/pay', protect, authorize('user'), processPayment);
router.post('/:id/create-payment-intent', protect, authorize('user'), createPaymentIntent);

// New startup quote endpoints
router.put('/:id/quote', protect, authorize('technician'), submitQuote);
router.put('/:id/approve-quote', protect, authorize('user'), approveQuote);

module.exports = router;
