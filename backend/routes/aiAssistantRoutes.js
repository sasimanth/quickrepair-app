const express = require('express');
const router = express.Router();
const { handleAiConversation, validateDraft } = require('../controllers/aiAssistantController');
const { protect } = require('../middleware/auth');

// All AI assistant actions run strictly under authenticated customer context
router.post('/converse', protect, handleAiConversation);
router.post('/validate-draft', protect, validateDraft);

module.exports = router;
