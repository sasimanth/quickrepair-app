import api from '../../services/api';

/**
 * Send conversational message to Fixvo AI Assistant backend
 * @param {string} message - User typed or spoken query
 * @param {object} currentDraft - Accumulated booking draft state
 * @param {array} conversationHistory - Past messages in the current session
 */
export const sendAiMessage = async (message, currentDraft = {}, conversationHistory = []) => {
  try {
    const res = await api.post('/ai/converse', {
      message,
      currentDraft,
      conversationHistory: conversationHistory.slice(-6) // Keep last 6 turns for context
    });
    return res.data;
  } catch (err) {
    console.error('AI Service Error:', err);
    throw err;
  }
};

/**
 * Validate draft and fetch live matching technicians
 */
export const validateAiDraft = async (draft) => {
  try {
    const res = await api.post('/ai/validate-draft', { draft });
    return res.data;
  } catch (err) {
    console.error('Validate Draft Error:', err);
    throw err;
  }
};
