const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect, authorize, ensureVerified } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');

router.get('/:bookingId', protect, authorize('user', 'technician', 'admin'), getMessages);
router.post('/:bookingId', protect, ensureVerified, authorize('user', 'technician', 'admin'), chatLimiter, sendMessage);

module.exports = router;
