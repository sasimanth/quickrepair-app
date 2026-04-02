const express = require('express');
const router = express.Router();
const { createBooking, getBookings, updateBookingStatus, assignBooking } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize('user', 'admin'), createBooking)
  .get(protect, getBookings); // Controller handles logic based on role

router.put('/:id/status', protect, authorize('user', 'technician', 'admin'), updateBookingStatus);
router.put('/:id/assign', protect, authorize('admin'), assignBooking);

module.exports = router;
