const express = require('express');
const { createReview, getTechnicianReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/:bookingId', protect, createReview);
router.get('/technician/:technicianId', protect, getTechnicianReviews);

module.exports = router;
