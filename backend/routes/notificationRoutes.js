const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  markRead, 
  markAllRead, 
  getVapidPublicKey, 
  subscribe, 
  registerFcmToken,
  unregisterFcmToken,
  getNotificationPreferences,
  updateNotificationPreferences
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllRead);
router.get('/preferences', protect, getNotificationPreferences);
router.put('/preferences', protect, updateNotificationPreferences);
router.put('/:id/read', protect, markRead);
router.get('/vapid-public-key', getVapidPublicKey);
router.post('/subscribe', protect, subscribe);
router.post('/fcm-token', protect, registerFcmToken);
router.delete('/fcm-token', protect, unregisterFcmToken);

module.exports = router;

