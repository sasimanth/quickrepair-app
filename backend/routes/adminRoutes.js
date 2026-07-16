const express = require('express');
const router = express.Router();
const { 
  getDashboardStats, getAllUsers, getWithdrawals, updateWithdrawalStatus,
  getPendingVerifications, reviewTechnician 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/withdrawals', getWithdrawals);
router.put('/withdrawals/:id/status', updateWithdrawalStatus);

// Verification Review Routes
router.get('/technicians/pending', getPendingVerifications);
router.put('/technicians/:id/verify', reviewTechnician);

module.exports = router;
