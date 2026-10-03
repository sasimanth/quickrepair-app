const express = require('express');
const router = express.Router();
const {
  generateInvoice,
  getInvoiceByBookingId,
  downloadInvoicePdf
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

router.post('/generate', protect, generateInvoice);
router.get('/booking/:bookingId', protect, getInvoiceByBookingId);
router.get('/:id/pdf', protect, downloadInvoicePdf);

module.exports = router;
