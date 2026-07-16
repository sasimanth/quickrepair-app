const Message = require('../models/Message');
const Booking = require('../models/Booking');

// @desc    Get all messages for a specific booking
// @route   GET /api/messages/:bookingId
const getMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Chat privacy validation
    const isOwner = booking.userId && booking.userId.toString() === req.user.id.toString();
    const isTech = booking.providerId && booking.providerId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isTech && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this private chat' });
    }

    // Mark messages sent by the other party as read and delivered
    await Message.updateMany(
      { bookingId, senderId: { $ne: req.user.id } },
      { $set: { isRead: true, isDelivered: true } }
    );

    const messages = await Message.find({ bookingId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const escapeHtml = (text) => {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const moderateText = (text) => {
  const cleanText = escapeHtml(text);

  // Phone number regex to match standard and spaced/dashed digits (8+ digits)
  const phoneRegex = /(\+?\d[\s-]?){8,14}\d/;

  // Link regex (excluding fixvo.com or localhost for platform compatibility)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,6}(\/[^\s]*)?)/gi;

  // Prohibited terms
  const badWords = ['scam', 'fraud', 'cheat', 'hack', 'abuse', 'fuck', 'asshole', 'bitch', 'scammer', 'cheater'];

  let flagged = false;
  let reason = '';

  if (phoneRegex.test(cleanText)) {
    flagged = true;
    reason = 'Sharing phone numbers in chat is restricted to prevent off-platform transaction scams.';
  } else if (urlRegex.test(cleanText)) {
    const urls = cleanText.match(urlRegex) || [];
    const isOnlyInternal = urls.every(u => {
      const lower = u.toLowerCase();
      return lower.includes('fixvo.com') || lower.includes('localhost:') || lower.startsWith('/');
    });
    if (!isOnlyInternal) {
      flagged = true;
      reason = 'Sharing external links in chat is blocked for security reasons.';
    }
  } else {
    const textLower = cleanText.toLowerCase();
    for (const word of badWords) {
      const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
      if (wordRegex.test(textLower)) {
        flagged = true;
        reason = 'Message contains restricted or abusive language.';
        break;
      }
    }
  }

  return { flagged, cleanText, reason };
};

// @desc    Send a new message
// @route   POST /api/messages/:bookingId
const sendMessage = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { text, senderName } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Chat privacy validation
    const isOwner = booking.userId && booking.userId.toString() === req.user.id.toString();
    const isTech = booking.providerId && booking.providerId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isTech && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to send messages in this private chat' });
    }

    // Run Chat Moderation
    const moderation = moderateText(text);
    if (moderation.flagged) {
      // Log Security Alert
      const SecurityAlert = require('../models/SecurityAlert');
      await SecurityAlert.create({
        userId: req.user.id,
        userEmail: req.user.email,
        alertType: 'CHAT_VIOLATION',
        severity: 'medium',
        description: `Message blocked: ${moderation.reason}. Original input: "${text.substring(0, 100)}"`,
        metadata: { ipAddress: req.ip, bookingId, userAgent: req.headers['user-agent'] }
      });

      return res.status(400).json({ message: moderation.reason });
    }

    const newMessage = await Message.create({
      bookingId,
      senderId: req.user.id,
      senderName: senderName || req.user.email.split('@')[0],
      text: moderation.cleanText
    });

    // Push live message to Chat room via Socket
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${bookingId}`).emit('receive_message', newMessage);
    }

    // Create DB notification of type 'chat' and send Web Push for the recipient
    const recipientId = isOwner ? booking.providerId : booking.userId;
    if (recipientId && !recipientId.startsWith('tech-')) {
      const User = require('../models/User');
      const recipientUser = await User.findById(recipientId);
      const { notifyUser } = require('../services/NotificationService');
      
      await notifyUser({
        userId: recipientId,
        email: recipientUser?.email || null,
        phone: recipientUser?.phone || null,
        type: 'push', // only push for messages to avoid email spam
        subject: `💬 New Message from ${senderName || req.user.email.split('@')[0]}`,
        text: moderation.cleanText,
        notifType: 'chat',
        bookingId: bookingId
      });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMessages, sendMessage };
