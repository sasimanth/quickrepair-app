const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, upgradePremium } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/premium', protect, upgradePremium);

module.exports = router;
