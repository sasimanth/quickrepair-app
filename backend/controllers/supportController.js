const SupportTicket = require('../models/SupportTicket');

// @desc    Create a new support ticket (Customer)
// @route   POST /api/support
// @access  Private
const createTicket = async (req, res) => {
  try {
    const { category, subject, message, bookingId } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required.' });
    }

    const ticket = await SupportTicket.create({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name || req.user.email?.split('@')[0] || 'Customer',
      bookingId: bookingId || null,
      category: category || 'General',
      subject,
      message,
      status: 'open'
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully.',
      ticket
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ message: 'Failed to create support ticket.', error: error.message });
  }
};

// @desc    Get user's own support tickets (Customer)
// @route   GET /api/support/my-tickets
// @access  Private
const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching user support tickets:', error);
    res.status(500).json({ message: 'Failed to fetch support tickets.' });
  }
};

// @desc    Get all support tickets (Admin only)
// @route   GET /api/support/admin/tickets
// @access  Private (Admin)
const getAllTicketsAdmin = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;

    const tickets = await SupportTicket.find(filter).sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching admin support tickets:', error);
    res.status(500).json({ message: 'Failed to fetch admin tickets.' });
  }
};

// @desc    Update support ticket status or resolution (Admin only)
// @route   PUT /api/support/admin/tickets/:id
// @access  Private (Admin)
const updateTicketAdmin = async (req, res) => {
  try {
    const { status, adminNotes, resolution, priority } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found.' });
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (adminNotes !== undefined) ticket.adminNotes = adminNotes;
    if (resolution !== undefined) {
      ticket.resolution = resolution;
      if (resolution && !ticket.resolvedAt) {
        ticket.resolvedAt = new Date();
      }
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Support ticket updated successfully.',
      ticket
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    res.status(500).json({ message: 'Failed to update support ticket.' });
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAllTicketsAdmin,
  updateTicketAdmin
};
