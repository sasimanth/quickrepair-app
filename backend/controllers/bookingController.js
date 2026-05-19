const Booking = require('../models/Booking');
const { notifyUser } = require('../services/NotificationService');
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const normalizePhone = (phone) => {
  if (!phone) return null;
  return phone.replace(/\D/g, "").slice(-10);
};

// @desc    Create a new booking (Unified for Guest/Auth)
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  const { 
    serviceId, date, deviceType, problemDescription, problemId, problemIds, location, detailedAddress, landmark, gpsLocation, imageUrl, mediaUrl, mediaType, providerId,
    unknownProblem, serviceOption, hasSpace, serviceLocation, isRestrictedArea, isUnderWarranty,
    name, phone, service, problem, address, timeSlot, areaType, transportCharge, transportOption,
    promoCode, discountPercentage
  } = req.body;
  
  try {
    let inspectionFee = 0;
    if (serviceOption === 'inspection') {
       inspectionFee = 15; // $15 inspection fee
    }

    let suggestedTools = ['Basic Screwdriver Set', 'Multimeter'];
    if (unknownProblem || problem === 'Other Issue') {
       suggestedTools.push('Diagnostic Kit', 'Universal Adapters');
    }
    const lowerProblem = (problemDescription || problem || '').toLowerCase();
    const lowerDevice = (deviceType || service || '').toLowerCase();
    if (lowerProblem.includes('screen') || lowerDevice.includes('phone') || lowerDevice.includes('tablet')) {
       suggestedTools.push('Screen Pry Tools', 'Heat Gun', 'Suction Cups');
    }
    if (lowerProblem.includes('water') || lowerDevice.includes('liquid')) {
       suggestedTools.push('Isopropyl Alcohol', 'Ultrasonic Cleaner');
    }

    const Technician = require('../models/Technician');
    let finalProviderId = providerId || null;
    let bStatus = 'pending';
    let assignedTechEmail = 'technician@fixvo.com';
    let assignedTechPhone = '+15551234567';

    let reqTimeSlot = timeSlot || 'ASAP';
    if (reqTimeSlot !== 'ASAP') {
      bStatus = "pending"; // Scheduled for later
    } else if (!finalProviderId) {
      // SMART AUTO-ASSIGNMENT if ASAP and no provider selected
      const availableTech = await Technician.findOne({ currentStatus: 'available', isOnline: true });
      if (availableTech) {
        finalProviderId = availableTech.userId;
        assignedTechEmail = availableTech.email || assignedTechEmail;
        bStatus = 'assigned'; 
      } else {
        const busyTech = await Technician.findOne({ currentStatus: { $in: ['busy', 'on_the_way'] }, isOnline: true }).sort('expectedAvailableTime');
        if (busyTech) {
           finalProviderId = busyTech.userId;
           bStatus = 'queued';
        } else {
           // Guarantee assignment for MVP/Test
           const fallbackTech = await Technician.findOne({});
           if (fallbackTech) {
             finalProviderId = fallbackTech.userId;
             bStatus = 'assigned';
             assignedTechEmail = fallbackTech.email;
           }
        }
      }
    } else {
      bStatus = 'assigned'; // Manually assigned -> pending acceptance
    }

    if (!location && !address) {
       return res.status(400).json({ message: "Area or Town is required." });
    }

    const bookingUserId = req.user ? req.user.id : null;
    const bookingUserEmail = req.user ? req.user.email : null;
    const finalName = name || (req.user ? req.user.name || req.user.email.split('@')[0] : null) || 'Guest User';
    let userPhoneNorm = null;
    if (req.user) userPhoneNorm = normalizePhone(req.user.phone);
    const finalPhone = normalizePhone(phone) || userPhoneNorm || '0000000000';

    let finalAddress = location || address || 'Not Specified';
    
    let mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(finalAddress)}`;

    const booking = new Booking({
      userId: bookingUserId,
      userEmail: bookingUserEmail,
      name: finalName,
      phone: finalPhone,
      serviceId: serviceId || null,
      serviceName: service || deviceType || 'Unknown Service',
      providerId: finalProviderId,
      date: date || new Date(),
      deviceType: deviceType || service || 'Unknown Device',
      problemDescription: problemDescription || problem || 'Not Specified',
      problemId: problemId || null,
      problemIds: problemIds || [],
      location: finalAddress,
      landmark: null,
      latitude: null,
      longitude: null,
      mapsLink: mapsLink,
      timeSlot: reqTimeSlot,
      imageUrl: imageUrl || '',
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || '',
      status: bStatus,
      unknownProblem: unknownProblem || false,
      serviceOption: serviceOption || 'direct',
      inspectionFee,
      hasSpace: hasSpace !== undefined ? hasSpace : true,
      serviceLocation: serviceLocation || 'on-site',
      isRestrictedArea: isRestrictedArea || false,
      isUnderWarranty: isUnderWarranty || false,
      suggestedTools,
      areaType: areaType || 'nearby',
      transportCharge: transportCharge || 50,
      transportOption: transportOption || 'doorstep',
      promoCode: promoCode || null,
      discountPercentage: discountPercentage || 0
    });
    const createdBooking = await booking.save();

    // Notification: Simulate WhatsApp message logic to Technician as requested
    const whatsappMessage = `New Job Assigned:\nCustomer: ${finalName}\nPhone: ${finalPhone}\nService: ${booking.serviceName}\nAddress: ${finalAddress}\nNavigate: ${mapsLink}`;

    if (finalProviderId && !finalProviderId.startsWith('tech-')) {
      notifyUser({
        userId: finalProviderId,
        email: assignedTechEmail,
        phone: assignedTechPhone,
        type: 'both',
        subject: bStatus === 'queued' ? 'New Job Added To Your Queue!' : 'New Job Assigned!',
        text: `Hey Technician, you have a new ${booking.serviceName} request. Open the app to check your pending/queued jobs!`
      });
    }

    // Attempt Google Sheets persistence for tracking
    const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL || 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
    if (GAS_WEB_APP_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      const axios = require('axios');
      try {
        await axios.post(GAS_WEB_APP_URL, {
          name: booking.name,
          phone: booking.phone,
          service: booking.serviceName,
          problem: booking.problemDescription,
          address: booking.location,
          assignedTech: finalProviderId || 'Unassigned',
          techPhone: assignedTechPhone,
          status: bStatus,
          price: ""
        });
      } catch (sheetErr) {
        console.error('Failed to save to Google Sheets:', sheetErr.message);
      }
    }

    res.status(201).json({ success: true, message: 'Booking created successfully', booking: createdBooking });
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
      const User = require('../models/User');
      const userDoc = await User.findById(req.user.id);
      const userPhoneNorm = userDoc && userDoc.phone ? normalizePhone(userDoc.phone) : null;
      const originalPhone = userDoc ? userDoc.phone : null;
      
      const query = { $or: [{ userId: req.user.id }] };
      const isDummyPhone = (p) => !p || p === '0000000000' || p === '1234567890' || p.length < 10;
      
      if (originalPhone && !isDummyPhone(originalPhone)) {
        query.$or.push({ phone: originalPhone });
      }
      if (userPhoneNorm && !isDummyPhone(userPhoneNorm)) {
        query.$or.push({ phone: userPhoneNorm });
        query.$or.push({ phone: new RegExp(userPhoneNorm, 'i') });
      }

      const bookings = await Booking.find(query)
        .populate('serviceId', 'name price')
        .sort('-createdAt');
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

    // Optional check
    if (req.user.role === 'technician' && booking.providerId !== req.user.id && !(booking.providerId?.startsWith('tech-'))) {
       return res.status(403).json({ message: 'Not authorized for this booking assignment' });
    }

    booking.status = status;
    const Technician = require('../models/Technician');
    let tech = null;
    if (req.user.role === 'technician') {
        tech = await Technician.findOne({ userId: req.user.id });
    }
    
    // Natively store the tech's email upon accepting
    if (status === 'accepted' && req.user.role === 'technician') {
      booking.providerEmail = req.user.email;
      if (tech) {
        tech.currentStatus = 'busy'; // or on_the_way
        tech.currentJobId = booking._id;
        tech.expectedAvailableTime = new Date(Date.now() + 90 * 60000); 
        await tech.save();
      }

      notifyUser({
        userId: booking.userId,
        email: booking.userEmail,
        type: 'both',
        subject: 'Technician on the way!',
        text: `Great news! Your technician has accepted the job and is on the way.`
      });
    }

    if (status === 'completed' && req.user.role === 'technician') {
      if (tech) {
        tech.currentStatus = 'available';
        tech.currentJobId = null;
        tech.expectedAvailableTime = null;
        tech.jobsCompleted = (tech.jobsCompleted || 0) + 1;
        await tech.save();

        // Check if there are queued ASAP jobs waiting for a technician
        const queuedJob = await Booking.findOne({ status: 'queued' }).sort({ createdAt: 1 });
        if (queuedJob) {
          queuedJob.providerId = tech.userId;
          queuedJob.status = "assigned";
          await queuedJob.save();
        }
      }
    }

    if (status === 'rejected' && req.user.role === 'technician') {
       booking.providerId = null;
       booking.status = 'pending';
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

// @desc    Process a mock payment for a booking
// @route   PUT /api/bookings/:id/pay
const processPayment = async (req, res) => {
  const { paymentMethod, amount } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const User = require('../models/User');
    const userDoc = await User.findById(req.user.id);
    const pPhone = userDoc && userDoc.phone ? normalizePhone(userDoc.phone) : null;
    const bPhone = booking.phone ? normalizePhone(booking.phone) : null;
    
    // To only allow paying if it's their booking or they are admin
    if (req.user.role === 'user') {
      const isOwnerById = booking.userId && booking.userId.toString() === req.user.id.toString();
      const isOwnerByPhone = pPhone && bPhone && pPhone === bPhone;
      if (!isOwnerById && !isOwnerByPhone) {
         return res.status(403).json({ message: 'Not authorized to pay for this booking' });
      }
    }

    booking.paymentStatus = 'completed';
    booking.paymentMethod = paymentMethod || 'mock';
    booking.amount = amount || 0;
    // Generate a mock transaction ID
    booking.transactionId = 'tx_' + Math.random().toString(36).substr(2, 9);

    const updatedBooking = await booking.save();

    // Optionally notify the technician that payment was successful
    if (booking.providerEmail) {
      notifyUser({
        userId: booking.providerId,
        email: booking.providerEmail,
        type: 'both',
        subject: 'Payment Received!',
        text: `Customer has paid $${booking.amount} for the completed job.`
      });
    }

    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Generate Stripe Payment Intent
// @route   POST /api/bookings/:id/create-payment-intent
const createPaymentIntent = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    const amountStr = req.body.amount || booking.amount || 15;
    const amount = Math.max(50, Math.round(Number(amountStr) * 100)); // Stripe amounts must be in minimal currency units (e.g., cents), minimum 50 cents.

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      metadata: { bookingId: booking._id.toString() },
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Submit a quote (Technician)
// @route   PUT /api/bookings/:id/quote
const submitQuote = async (req, res) => {
  const { finalQuote, quoteReason, quotePhoto, detectedIssues } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    // Authorization check
    if (req.user.role === 'technician' && booking.providerId !== req.user.id && !(booking.providerId?.startsWith('tech-'))) {
       return res.status(403).json({ message: 'Not authorized for this booking assignment' });
    }

    booking.finalQuote = finalQuote;
    booking.quoteReason = quoteReason;
    booking.detectedIssues = detectedIssues;
    booking.quotePhoto = quotePhoto;
    booking.status = 'quote_pending';
    booking.quoteApproved = false;

    const updatedBooking = await booking.save();
    
    notifyUser({
      userId: booking.userId,
      email: booking.userEmail,
      type: 'both',
      subject: 'Action Required: Approve Final Quote',
      text: `Your technician has diagnosed the issue and provided a final quote of $${finalQuote}. Please review and approve in the app.`
    });

    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Approve a quote (Customer)
// @route   PUT /api/bookings/:id/approve-quote
const approveQuote = async (req, res) => {
  const { approved } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    const User = require('../models/User');
    const userDoc = await User.findById(req.user.id);
    const pPhone = userDoc && userDoc.phone ? normalizePhone(userDoc.phone) : null;
    const bPhone = booking.phone ? normalizePhone(booking.phone) : null;
    
    const isOwnerById = booking.userId && booking.userId.toString() === req.user.id.toString();
    const isOwnerByPhone = pPhone && bPhone && pPhone === bPhone;
    
    if (!isOwnerById && !isOwnerByPhone) {
       return res.status(403).json({ message: 'Not authorized to approve quote' });
    }

    if (approved) {
      booking.quoteApproved = true;
      booking.status = 'quote_approved'; // Fix Workflow Logic
    } else {
      booking.quoteApproved = false;
      booking.status = 'rejected';
    }

    const updatedBooking = await booking.save();

    if (booking.providerEmail) {
      notifyUser({
        userId: booking.providerId,
        email: booking.providerEmail,
        type: 'both',
        subject: approved ? 'Quote Approved!' : 'Quote Rejected',
        text: approved ? 'The customer approved the quote. You may start the repair.' : 'The customer rejected your quote.'
      });
    }

    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createBooking, getBookings, updateBookingStatus, assignBooking, processPayment, createPaymentIntent, submitQuote, approveQuote };
