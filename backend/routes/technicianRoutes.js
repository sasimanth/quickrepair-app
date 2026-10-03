const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getNearbyTechnicians, submitVerification, updateJobStatus, requestWithdrawal, submitKyc } = require('../controllers/technicianController');
const { protect, authorize } = require('../middleware/auth');
const { kycLimiter, verificationLimiter } = require('../middleware/rateLimiter');

router.get('/profile', protect, authorize('technician'), getProfile);
router.put('/profile', protect, authorize('technician'), updateProfile);
router.post('/verify', protect, authorize('technician'), verificationLimiter, submitVerification);
router.get('/nearby', getNearbyTechnicians);
router.put('/job-status', protect, authorize('technician'), updateJobStatus);
router.post('/withdraw', protect, authorize('technician'), requestWithdrawal);
router.post('/kyc', protect, authorize('technician'), kycLimiter, submitKyc);

module.exports = router;

