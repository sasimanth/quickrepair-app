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

    // Mark messages sent by the other party as read
    await Message.updateMany(
      { bookingId, senderId: { $ne: req.user.id }, isRead: false },
      { isRead: true }
    );

    const messages = await Message.find({ bookingId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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

    const newMessage = await Message.create({
      bookingId,
      senderId: req.user.id,
      senderName: senderName || req.user.email.split('@')[0],
      text
    });

    // Push live message to Chat room via Socket
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${bookingId}`).emit('receive_message', newMessage);
    }

    // Create DB notification of type 'chat' for the recipient
    const recipientId = isOwner ? booking.providerId : booking.userId;
    if (recipientId && !recipientId.startsWith('tech-')) {
      const Notification = require('../models/Notification');
      const chatNotif = await Notification.create({
        userId: recipientId,
        title: `💬 New Message from ${senderName || req.user.email.split('@')[0]}`,
        message: text,
        isRead: false,
        type: 'chat',
        bookingId: bookingId
      });
      if (io) {
        io.to(`user_${recipientId}`).emit('new_notification', chatNotif);
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMessages, sendMessage };
