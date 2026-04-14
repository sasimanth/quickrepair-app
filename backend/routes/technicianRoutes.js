const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getNearbyTechnicians, submitVerification, updateJobStatus } = require('../controllers/technicianController');
const { protect, authorize } = require('../middleware/auth');

router.get('/profile', protect, authorize('technician'), getProfile);
router.put('/profile', protect, authorize('technician'), updateProfile);
router.post('/verify', protect, authorize('technician'), submitVerification);
router.get('/nearby', protect, authorize('user', 'admin'), getNearbyTechnicians);
router.put('/job-status', protect, authorize('technician'), updateJobStatus);

module.exports = router;
