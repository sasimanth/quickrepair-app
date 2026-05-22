const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect, authorize } = require('../middleware/auth');

router.get('/:bookingId', protect, authorize('user', 'technician', 'admin'), getMessages);
router.post('/:bookingId', protect, authorize('user', 'technician', 'admin'), sendMessage);

module.exports = router;
