const express = require('express');
const router = express.Router();
const { 
  createBooking, getBookings, updateBookingStatus, assignBooking, processPayment, 
  createPaymentIntent, submitQuote, approveQuote, cancelBooking, 
  requestQuoteClarification, respondQuoteClarification 
} = require('../controllers/bookingController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.route('/')
  .post(optionalAuth, createBooking)
  .get(protect, getBookings); // Controller handles logic based on role

router.put('/:id/status', protect, authorize('user', 'technician', 'admin'), updateBookingStatus);
router.put('/:id/assign', protect, authorize('admin'), assignBooking);
router.put('/:id/pay', protect, authorize('user', 'technician'), processPayment);
router.post('/:id/create-payment-intent', protect, authorize('user'), createPaymentIntent);
router.put('/:id/cancel', protect, cancelBooking);

// New startup quote endpoints
router.put('/:id/quote', protect, authorize('technician'), submitQuote);
router.put('/:id/approve-quote', protect, authorize('user'), approveQuote);
router.put('/:id/clarify-quote', protect, authorize('user'), requestQuoteClarification);
router.put('/:id/respond-quote', protect, authorize('technician'), respondQuoteClarification);

module.exports = router;
