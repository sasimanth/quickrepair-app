const express = require('express');
const router = express.Router();
const { 
  createTicket, 
  getMyTickets, 
  getAllTicketsAdmin, 
  updateTicketAdmin 
} = require('../controllers/supportController');
const { protect, authorize } = require('../middleware/auth');

// Customer Support Routes
router.post('/', protect, createTicket);
router.get('/my-tickets', protect, getMyTickets);

// Admin Support Routes
router.get('/admin/tickets', protect, authorize('admin'), getAllTicketsAdmin);
router.put('/admin/tickets/:id', protect, authorize('admin'), updateTicketAdmin);

module.exports = router;
