const express = require('express');
const router = express.Router();
const { getServices, createService, updateService, deleteService } = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/auth');

// GET allows anyone to see services. For local demo, POST allows anyone to add a service to avoid token rejection loops.
router.route('/')
  .get(getServices)
  .post(createService);

router.route('/:id')
  .put(updateService)
  .delete(deleteService);

module.exports = router;
