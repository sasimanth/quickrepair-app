const express = require('express');
const router = express.Router();
const { getPayoutLogs } = require('../controllers/payoutController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getPayoutLogs);

module.exports = router;
