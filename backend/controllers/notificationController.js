const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const { getVapidKeys } = require('../utils/vapidHelper');

// @desc    Get all notifications for logged-in user
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Not found' });
    
    // Security verification
    if (notif.userId !== req.user.id) return res.status(403).json({ message: 'Unauthorized access' });
    
    notif.isRead = true;
    await notif.save();
    
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get VAPID Public Key
// @route   GET /api/notifications/vapid-public-key
const getVapidPublicKey = async (req, res) => {
  try {
    const keys = getVapidKeys();
    res.json({ publicKey: keys.publicKey });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Subscribe to push notifications
// @route   POST /api/notifications/subscribe
const subscribe = async (req, res) => {
  try {
    const { subscription, deviceId, browser, platform } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return res.status(400).json({ message: 'Invalid subscription object or missing keys' });
    }
    if (!deviceId) {
      return res.status(400).json({ message: 'Missing deviceId parameter' });
    }

    // Clean up any stale subscription for this device to prevent duplicate deliveries
    await PushSubscription.deleteMany({ deviceId });

    // Upsert the subscription for this user & device
    await PushSubscription.findOneAndUpdate(
      { userId: req.user.id, deviceId, endpoint: subscription.endpoint },
      {
        userId: req.user.id,
        role: req.user.role,
        deviceId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        },
        browser: browser || 'Unknown',
        platform: platform || 'Unknown',
        lastSeen: new Date(),
        isActive: true
      },
      { upsert: true, new: true }
    );

    // Upsert corresponding DeviceSession for verification check
    const DeviceSession = require('../models/DeviceSession');
    let techProfile = null;
    if (req.user.role === 'technician') {
      const Technician = require('../models/Technician');
      techProfile = await Technician.findOne({ userId: req.user.id });
    }
    
    await DeviceSession.findOneAndUpdate(
      { userId: req.user.id, deviceId },
      {
        userId: req.user.id,
        technicianId: techProfile ? techProfile._id.toString() : null,
        role: req.user.role,
        deviceId,
        browser: browser || 'Unknown',
        platform: platform || 'Unknown',
        lastSeen: new Date(),
        isActive: true
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, message: 'Subscribed to push notifications successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getNotifications, markRead, getVapidPublicKey, subscribe };
