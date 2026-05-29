const express = require('express');
const router = express.Router();
const { getNotifications, markRead, getVapidPublicKey, subscribe } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markRead);
router.get('/vapid-public-key', getVapidPublicKey);
router.post('/subscribe', protect, subscribe);

module.exports = router;
