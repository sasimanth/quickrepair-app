const Contact = require('../models/Contact');
const sendEmail = require('../utils/sendEmail');

const submitContactForm = async (req, res) => {
  const { firstName, lastName, email, message } = req.body;

  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const contact = await Contact.create({ firstName, lastName, email, message });

    // Send email to admin
    await sendEmail({
      to: 'admin@fixvo.com', // Expected admin inbox
      subject: `New Contact Inquiry from ${firstName} ${lastName}`,
      text: `You have received a new message from ${firstName} ${lastName} (${email}):\n\n${message}`,
    });

    // Optionally send confirmation to user
    await sendEmail({
      to: email, 
      subject: `Fixvo: We received your message!`,
      text: `Hi ${firstName},\n\nThank you for reaching out to Fixvo. We have received your message and our team will get back to you within 24 hours.\n\nYour message:\n"${message}"\n\nBest,\nThe Fixvo Team`,
    });

    res.status(201).json({ success: true, message: 'Message sent successfully', contact });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
};

module.exports = { submitContactForm };
