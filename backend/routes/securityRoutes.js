const express = require('express');
const router = express.Router();
const { getSecurityAlerts, getAuditLogs, resolveAlert } = require('../controllers/securityController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/alerts', getSecurityAlerts);
router.put('/alerts/:id/resolve', resolveAlert);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
