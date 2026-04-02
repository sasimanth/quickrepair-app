const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getNearbyTechnicians } = require('../controllers/technicianController');
const { protect, authorize } = require('../middleware/auth');

router.get('/profile', protect, authorize('technician'), getProfile);
router.put('/profile', protect, authorize('technician'), updateProfile);
router.get('/nearby', protect, authorize('user', 'admin'), getNearbyTechnicians);

module.exports = router;
