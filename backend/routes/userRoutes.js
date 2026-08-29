const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, upgradePremium, convertPoints, getWalletStats } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/premium', protect, upgradePremium);
router.post('/convert-points', protect, convertPoints);
router.get('/wallet-balance', protect, getWalletStats);

module.exports = router;
