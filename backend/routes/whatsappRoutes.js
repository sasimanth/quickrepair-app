const express = require('express');
const router = express.Router();
const { handleIncomingWhatsAppMessage } = require('../controllers/whatsappController');

// Twilio will send POST requests here when a WhatsApp message is received
router.post('/webhook', handleIncomingWhatsAppMessage);

module.exports = router;
