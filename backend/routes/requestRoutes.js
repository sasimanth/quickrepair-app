const express = require('express');
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  getAvailableRequests,
  acceptRequest,
  updateRequestStatus
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('user'), createRequest);
router.get('/myrequests', protect, authorize('user', 'admin'), getMyRequests);
router.get('/available', protect, authorize('technician', 'admin'), getAvailableRequests);
router.put('/:id/accept', protect, authorize('technician'), acceptRequest);
router.put('/:id/status', protect, authorize('technician', 'admin'), updateRequestStatus);

module.exports = router;
