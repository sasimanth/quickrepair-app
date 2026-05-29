const express = require('express');
const router = express.Router();
const { getDocument, updateDocument, getAllDocuments, acceptDocument, getComplianceLogs } = require('../controllers/legalController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/document/:type', getDocument);

// Protected routes (authenticated users)
router.post('/accept', protect, acceptDocument);

// Admin-only routes
router.get('/documents', protect, authorize('admin'), getAllDocuments);
router.put('/document/:type', protect, authorize('admin'), updateDocument);
router.get('/logs', protect, authorize('admin'), getComplianceLogs);

module.exports = router;
