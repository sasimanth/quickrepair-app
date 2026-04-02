const Message = require('../models/Message');
const Booking = require('../models/Booking');

// @desc    Get all messages for a specific booking
// @route   GET /api/messages/:bookingId
const getMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Optional Check: Is the user authorized to see these messages?
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (
      req.user.role === 'user' && booking.userId !== req.user.id ||
      req.user.role === 'technician' && booking.providerId !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

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

    if (
      req.user.role === 'user' && booking.userId !== req.user.id ||
      req.user.role === 'technician' && booking.providerId !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized to send messages for this job' });
    }

    const newMessage = await Message.create({
      bookingId,
      senderId: req.user.id,
      senderName: senderName || req.user.email.split('@')[0],
      text
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMessages, sendMessage };
