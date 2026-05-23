const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllUsers, getWithdrawals, updateWithdrawalStatus } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/withdrawals', getWithdrawals);
router.put('/withdrawals/:id/status', updateWithdrawalStatus);

module.exports = router;
