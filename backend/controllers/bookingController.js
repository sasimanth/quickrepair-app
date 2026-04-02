const Booking = require('../models/Booking');
const { notifyUser } = require('../services/NotificationService');

// @desc    Create a new booking (Customer)
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  const { 
    serviceId, date, deviceType, problemDescription, location, imageUrl, providerId,
    unknownProblem, serviceOption, hasSpace, serviceLocation, isRestrictedArea, isUnderWarranty
  } = req.body;
  
  try {
    let inspectionFee = 0;
    if (serviceOption === 'inspection') {
       inspectionFee = 15; // $15 inspection fee
    }

    let suggestedTools = ['Basic Screwdriver Set', 'Multimeter'];
    if (unknownProblem) {
       suggestedTools.push('Diagnostic Kit', 'Universal Adapters');
    }
    const lowerProblem = (problemDescription || '').toLowerCase();
    const lowerDevice = (deviceType || '').toLowerCase();
    if (lowerProblem.includes('screen') || lowerDevice.includes('phone') || lowerDevice.includes('tablet')) {
       suggestedTools.push('Screen Pry Tools', 'Heat Gun', 'Suction Cups');
    }
    if (lowerProblem.includes('water') || lowerDevice.includes('liquid')) {
       suggestedTools.push('Isopropyl Alcohol', 'Ultrasonic Cleaner');
    }

    const booking = new Booking({
      userId: req.user.id,
      userEmail: req.user.email, // Natively store the email
      serviceId,
      providerId: providerId || null, // Direct assignment from frontend selection
      date,
      deviceType,
      problemDescription,
      location,
      imageUrl,
      status: 'pending', // Remains pending until the assigned technician accepts it
      unknownProblem: unknownProblem || false,
      serviceOption: serviceOption || 'direct',
      inspectionFee,
      hasSpace: hasSpace !== undefined ? hasSpace : true,
      serviceLocation: serviceLocation || 'on-site',
      isRestrictedArea: isRestrictedArea || false,
      isUnderWarranty: isUnderWarranty || false,
      suggestedTools
    });
    const createdBooking = await booking.save();

    if (providerId && !providerId.startsWith('tech-')) {
      notifyUser({
        userId: providerId,
        email: 'technician@quickrepair.com', // Replace with real tech email
        phone: '+15551234567', // REPLACE WITH YOUR REAL CELL PHONE NUMBER TO TEST TWILIO (Must include +1)
        type: 'both',
        subject: 'New Job Assigned!',
        text: `Hey Technician, you just got a new $${booking.serviceId?.price || 150} ${deviceType} repair request 2 miles away. Open the app to Accept or Decline!`
      });
    }

    res.status(201).json(createdBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get bookings based on user role
// @route   GET /api/bookings
const getBookings = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const bookings = await Booking.find({})
        .populate('serviceId', 'name price');
      return res.json(bookings);
    } else if (req.user.role === 'technician') {
      // A technician sees only jobs assigned explicitly to them
      // (For demonstration/MVP testing purposes, we also fetch jobs assigned to dummy 'tech-' ids)
      const jobs = await Booking.find({
        $or: [
          { providerId: req.user.id },
          { providerId: { $regex: '^tech-' } }
        ]
      })
        .populate('serviceId', 'name price');
      return res.json(jobs);
    } else {
      // Regular User
      const bookings = await Booking.find({ userId: req.user.id })
        .populate('serviceId', 'name price');
      return res.json(bookings);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a booking status (Accept, Complete, Reject)
// @route   PUT /api/bookings/:id/status
const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Optional check: if technician is modifying, ensure it was assigned to them (or a mock tech id)
    if (req.user.role === 'technician' && booking.providerId !== req.user.id && !(booking.providerId?.startsWith('tech-'))) {
       return res.status(403).json({ message: 'Not authorized for this booking assignment' });
    }

    booking.status = status;
    
    // Natively store the tech's email upon accepting
    if (status === 'accepted' && req.user.role === 'technician') {
      booking.providerEmail = req.user.email;

      notifyUser({
        userId: booking.userId,
        email: booking.userEmail,
        type: 'both',
        subject: 'Technician Accepted Your Job!',
        text: `Great news! Your technician has accepted the job and sent you a chat message!`
      });
    }

    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Assign a booking to a technician (Admin)
// @route   PUT /api/bookings/:id/assign
const assignBooking = async (req, res) => {
  const { providerId } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    booking.providerId = providerId;
    booking.status = 'accepted';
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createBooking, getBookings, updateBookingStatus, assignBooking };
