const express = require('express');
const router = express.Router();
const { 
  getDashboardStats, getAllUsers, getWithdrawals, updateWithdrawalStatus,
  getPendingVerifications, reviewTechnician, reviewKyc, getDocumentSignedUrl 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/withdrawals', getWithdrawals);
router.put('/withdrawals/:id/status', updateWithdrawalStatus);

// Verification & KYC Review Routes
router.get('/technicians/pending', getPendingVerifications);
router.put('/technicians/:id/verify', reviewTechnician);
router.put('/technicians/:id/kyc-review', reviewKyc);
router.get('/technicians/:id/documents/:docType', getDocumentSignedUrl);

module.exports = router;

