const Booking = require('../models/Booking');
const { notifyUser } = require('../services/NotificationService');
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const normalizePhone = (phone) => {
  if (!phone) return null;
  return phone.replace(/\D/g, "").slice(-10);
};

// AUTOMATED NOTIFICATION & CHAT MESSAGE HELPER
const triggerNotifications = async (req, booking, type) => {
  try {
    const Notification = require('../models/Notification');
    const Message = require('../models/Message');
    const io = req.app.get('io');
    
    let title = '';
    let message = '';
    let chatText = '';
    let recipientId = booking.userId;

    // Fetch technician name
    let techName = 'Technician';
    if (booking.providerId) {
      const User = require('../models/User');
      const techUser = await User.findById(booking.providerId);
      if (techUser) {
        techName = techUser.name;
      }
    }

    switch (type) {
      case 'accepted':
        title = 'Repair Request Accepted! 🟢';
        message = `Technician ${techName} has accepted your request.`;
        chatText = `📢 System: Technician ${techName} has accepted the job and is reviewing details.`;
        recipientId = booking.userId;
        break;
      case 'rejected':
        title = 'Technician Re-Assignment 🔄';
        message = `Technician was unable to take this job. Re-matching you with a new tech...`;
        chatText = `📢 System: Job request was declined by the technician. Finding a new match...`;
        recipientId = booking.userId;
        break;
      case 'on_the_way':
        title = 'Technician On The Way! 🚀';
        message = `Technician ${techName} has started their journey to your location.`;
        chatText = `📢 System: Technician ${techName} is on the way.`;
        recipientId = booking.userId;
        break;
      case 'arrived':
        title = 'Technician Arrived! 🏡';
        message = `Technician ${techName} has arrived at your address.`;
        chatText = `📢 System: Technician ${techName} has arrived at the location.`;
        recipientId = booking.userId;
        break;
      case 'quote_pending':
        title = 'Action Required: Final Quote Received 📋';
        message = `Technician ${techName} has submitted a final quote of ₹${booking.finalQuote}. Please approve to proceed.`;
        chatText = `📢 System: Technician ${techName} submitted a final quote of ₹${booking.finalQuote}. Please review and approve.`;
        recipientId = booking.userId;
        break;
      case 'quote_approved':
        title = 'Quote Approved! 🛠️';
        message = `You approved the quote. Repair work is now in progress.`;
        chatText = `📢 System: Customer approved the final quote of ₹${booking.finalQuote}. Work in progress.`;
        recipientId = booking.providerId; // Notify tech
        break;
      case 'completed':
        title = 'Repair Job Completed! 🎉';
        message = `Your technician marked the job as completed. Thank you!`;
        chatText = `📢 System: Technician marked the service as completed.`;
        recipientId = booking.userId;
        break;
      case 'payment_completed':
        title = 'Payment Received! 💳';
        message = `Thank you! Payment of ₹${booking.amount} has been successfully completed.`;
        chatText = `📢 System: Payment of ₹${booking.amount} completed successfully.`;
        recipientId = booking.providerId; // Notify tech
        break;
      case 'cancelled':
        title = 'Service Booking Cancelled ❌';
        message = `This booking has been cancelled. Reason: ${booking.cancellationReason || 'No reason specified'}.`;
        chatText = `📢 System: Booking cancelled by ${booking.cancelledBy === 'customer' ? 'Customer' : 'Technician'}. Reason: ${booking.cancellationReason || 'No reason specified'}.`;
        recipientId = booking.cancelledBy === 'customer' ? booking.providerId : booking.userId;
        break;
      default:
        return;
    }

    // 1. Create DB Notification for recipient (if valid user ID)
    if (recipientId && !recipientId.startsWith('tech-')) {
      const notifType = ['accepted', 'rejected', 'on_the_way', 'arrived'].includes(type) ? 'booking' : 'system';
      const createdNotif = await Notification.create({
        userId: recipientId,
        title,
        message,
        isRead: false,
        type: notifType,
        bookingId: booking._id.toString()
      });
      if (io) {
        io.to(`user_${recipientId}`).emit('new_notification', createdNotif);
      }
    }

    // 2. Create DB Message inside Chat for system notifications
    let newMsg = null;
    if (chatText) {
      newMsg = await Message.create({
        bookingId: booking._id,
        senderId: 'system',
        senderName: 'System',
        text: chatText
      });
      if (io) {
        io.to(`chat_${booking._id}`).emit('receive_message', newMsg);
      }
    }

    // 3. Emit Sockets
    if (io) {
      // Refresh User Dashboard
      if (booking.userId) {
        io.to(`user_${booking.userId}`).emit('job_update', booking);
      }
      // Refresh Tech Dashboard
      if (booking.providerId) {
        io.to(`user_${booking.providerId}`).emit('job_update', booking);
      }
    }
  } catch (e) {
    console.error('Trigger Notifications Error:', e);
  }
};

// @desc    Create a new booking (Unified for Guest/Auth)
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  const { 
    serviceId, date, deviceType, problemDescription, problemId, problemIds, location, detailedAddress, landmark, gpsLocation, imageUrl, mediaUrl, mediaType, providerId,
    unknownProblem, serviceOption, hasSpace, serviceLocation, isRestrictedArea, isUnderWarranty,
    name, phone, service, problem, address, timeSlot, areaType, transportCharge, transportOption,
    promoCode, discountPercentage,
    areaSize, houseType, numberOfRooms, wallArea, indoorOutdoor, paintPreference, applianceType, installationLocation, accessoriesNeeded
  } = req.body;
  
  try {
    const bookingUserId = req.user ? req.user.id : null;
    let userPhone = null;
    if (req.user) {
      const User = require('../models/User');
      const userDoc = await User.findById(req.user.id);
      if (userDoc) {
        userPhone = userDoc.phone;
      }
    }
    const finalPhone = normalizePhone(phone) || normalizePhone(userPhone) || '0000000000';

    // DUPLICATE SUBMISSION CHECK (Within last 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const duplicate = await Booking.findOne({
      $or: [
        { userId: bookingUserId, userId: { $ne: null } },
        { phone: finalPhone }
      ],
      serviceId: serviceId || null,
      createdAt: { $gte: twoMinutesAgo }
    });

    if (duplicate) {
      return res.status(409).json({ message: 'Duplicate booking detected. Please wait 2 minutes before resubmitting.' });
    }

    let isPremiumUser = false;
    if (req.user) {
      const User = require('../models/User');
      const userDoc = await User.findById(req.user.id);
      if (userDoc && userDoc.isPremium) {
        isPremiumUser = true;
      }
    }

    let inspectionFee = 0;
    if (serviceOption === 'inspection') {
       inspectionFee = isPremiumUser ? 0 : 99; // Standard ₹99 inspection fee, ₹0 for premium members
    }

    const Technician = require('../models/Technician');
    let finalProviderId = providerId || null;
    let bStatus = 'pending';
    let assignedTechEmail = 'technician@fixvo.com';
    let assignedTechPhone = null;

    let reqTimeSlot = timeSlot || 'ASAP';
    if (reqTimeSlot !== 'ASAP') {
      bStatus = "pending"; // Scheduled for later
    } else if (!finalProviderId) {
      // SMART AUTO-ASSIGNMENT WITH AREA & SERVICE CATEGORY FILTERING
      let matchedArea = null;
      const locationLower = (location || address || '').toLowerCase();
      if (locationLower.includes('madanapalle')) matchedArea = 'Madanapalle';
      else if (locationLower.includes('kadiri')) matchedArea = 'Kadiri';
      else if (locationLower.includes('rayachoty')) matchedArea = 'Rayachoty';
      else if (locationLower.includes('galiveedu')) matchedArea = 'Galiveedu';

      const techQuery = { currentStatus: 'available', isOnline: true };
      if (matchedArea) {
        techQuery.area = matchedArea;
      }
      if (serviceId) {
        techQuery.services = serviceId;
      }

      let availableTech = await Technician.findOne(techQuery);
      
      // Fallback 1: Available tech in the same area regardless of category
      if (!availableTech && matchedArea) {
        availableTech = await Technician.findOne({ currentStatus: 'available', isOnline: true, area: matchedArea });
      }

      // Fallback 2: Any available online tech
      if (!availableTech) {
        availableTech = await Technician.findOne({ currentStatus: 'available', isOnline: true });
      }

      if (availableTech) {
        finalProviderId = availableTech.userId;
        assignedTechEmail = availableTech.email || assignedTechEmail;
        assignedTechPhone = availableTech.phone || assignedTechPhone;
        bStatus = 'assigned'; 
      } else {
        // Fallback 3: Search for busy tech in matching area
        const busyQuery = { currentStatus: { $in: ['busy', 'on_the_way'] }, isOnline: true };
        if (matchedArea) busyQuery.area = matchedArea;
        if (serviceId) busyQuery.services = serviceId;
        
        let busyTech = await Technician.findOne(busyQuery).sort('expectedAvailableTime');
        if (busyTech) {
           finalProviderId = busyTech.userId;
           assignedTechPhone = busyTech.phone || assignedTechPhone;
           bStatus = 'queued';
        } else {
           // Guarantee assignment using fallback offline technicians
           const fallbackQuery = {};
           if (matchedArea) fallbackQuery.area = matchedArea;
           if (serviceId) fallbackQuery.services = serviceId;
           
           let fallbackTech = await Technician.findOne(fallbackQuery);
           if (!fallbackTech && matchedArea) {
             fallbackTech = await Technician.findOne({ area: matchedArea });
           }
           if (!fallbackTech) {
             fallbackTech = await Technician.findOne({});
           }
           
           if (fallbackTech) {
             finalProviderId = fallbackTech.userId;
             assignedTechPhone = fallbackTech.phone || assignedTechPhone;
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

    const bookingUserEmail = req.user ? req.user.email : null;
    const finalName = name || (req.user ? req.user.name || req.user.email.split('@')[0] : null) || 'Guest User';

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
      landmark: landmark || null,
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
      providerPhone: assignedTechPhone,
      areaType: areaType || 'nearby',
      transportCharge: transportCharge || 50,
      transportOption: transportOption || 'doorstep',
      promoCode: isPremiumUser ? 'FIXVO_PLUS' : (promoCode || null),
      discountPercentage: isPremiumUser ? 15 : (discountPercentage || 0),
      isPremiumUser,
      areaSize: areaSize || null,
      houseType: houseType || null,
      numberOfRooms: numberOfRooms || null,
      wallArea: wallArea || null,
      indoorOutdoor: indoorOutdoor || null,
      paintPreference: paintPreference || null,
      applianceType: applianceType || null,
      installationLocation: installationLocation || null,
      accessoriesNeeded: accessoriesNeeded || null
    });
    const createdBooking = await booking.save();

    // Send real-time Socket Alert to Assigned Tech
    const io = req.app.get('io');
    if (finalProviderId && io) {
      io.to(`user_${finalProviderId}`).emit('new_job', createdBooking);
    }

    if (finalProviderId && !finalProviderId.startsWith('tech-')) {
      notifyUser({
        userId: finalProviderId,
        email: assignedTechEmail,
        phone: assignedTechPhone,
        type: 'both',
        subject: bStatus === 'queued' ? 'New Job Added To Your Queue!' : 'New Job Assigned!',
        text: `Hey Technician, you have a new ${booking.serviceName} request. Open the app to check your pending/queued jobs!`,
        notifType: 'booking',
        bookingId: booking._id.toString()
      });
      
      // Seed initial DB notification for tech
      const Notification = require('../models/Notification');
      const techNotif = await Notification.create({
        userId: finalProviderId,
        title: bStatus === 'queued' ? 'New Job Queued' : 'New Job Assigned! 💼',
        message: `New repair request for ${booking.serviceName} at ${finalAddress}.`,
        type: 'booking',
        bookingId: booking._id.toString()
      });
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${finalProviderId}`).emit('new_notification', techNotif);
      }
    }

    // Google Sheets integration
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

const enrichBookingsWithChat = async (bookings, userId) => {
  const Message = require('../models/Message');
  const User = require('../models/User');
  return Promise.all(bookings.map(async (b) => {
    const unreadCount = await Message.countDocuments({ bookingId: b._id, senderId: { $ne: userId, $ne: 'system' }, isRead: false });
    const lastMsg = await Message.findOne({ bookingId: b._id, senderId: { $ne: 'system' } }).sort({ createdAt: -1 });
    
    let customerPhone = b.phone;
    if ((!customerPhone || customerPhone === '0000000000' || customerPhone === '1234567890') && b.userId) {
      const customer = await User.findById(b.userId);
      if (customer && customer.phone) {
        customerPhone = customer.phone;
      }
    }

    let technicianName = 'Unassigned';
    if (b.providerId) {
      const techUser = await User.findById(b.providerId);
      if (techUser) {
        technicianName = techUser.name;
      }
    }

    return {
      ...b.toObject(),
      customerPhone,
      technicianName,
      unreadCount,
      lastMessage: lastMsg ? {
        text: lastMsg.text,
        createdAt: lastMsg.createdAt,
        senderId: lastMsg.senderId,
        isRead: lastMsg.isRead
      } : null
    };
  }));
};

// @desc    Get bookings based on user role
// @route   GET /api/bookings
const getBookings = async (req, res) => {
  try {
    let bookings;
    if (req.user.role === 'admin') {
      bookings = await Booking.find({})
        .populate('serviceId', 'name price');
    } else if (req.user.role === 'technician') {
      bookings = await Booking.find({ providerId: req.user.id })
        .populate('serviceId', 'name price');
    } else {
      // Regular User - Strictly filter by logged-in user ID to prevent cross-user access
      bookings = await Booking.find({ userId: req.user.id })
        .populate('serviceId', 'name price')
        .sort('-createdAt');
    }
    
    const enriched = await enrichBookingsWithChat(bookings, req.user.id);
    return res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a booking status (Accept, Complete, Reject, Journey, Arrived)
// @route   PUT /api/bookings/:id/status
const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.user.role === 'technician' && booking.providerId !== req.user.id && !(booking.providerId?.startsWith('tech-'))) {
       return res.status(403).json({ message: 'Not authorized for this booking assignment' });
    }

    // DUPLICATE JOB ACCEPTANCE CHECK: Prevent multiple tech acceptance race-conditions
    if (status === 'accepted') {
      if (booking.status === 'accepted' || (booking.providerId && booking.providerId !== req.user.id && !booking.providerId.startsWith('tech-'))) {
        return res.status(400).json({ message: 'This booking has already been accepted by another technician.' });
      }
    }

    booking.status = status;
    const Technician = require('../models/Technician');
    let tech = null;
    if (req.user.role === 'technician') {
        tech = await Technician.findOne({ userId: req.user.id });
    }
    
    if (status === 'accepted' && req.user.role === 'technician') {
      booking.providerEmail = req.user.email;
      booking.providerId = req.user.id; // Fully bind technician
      if (tech) {
        tech.currentStatus = 'busy';
        tech.currentJobId = booking._id;
        tech.expectedAvailableTime = new Date(Date.now() + 90 * 60000); 
        await tech.save();
        if (tech.phone) {
          booking.providerPhone = tech.phone;
        }
      }

      notifyUser({
        userId: booking.userId,
        email: booking.userEmail,
        type: 'both',
        subject: 'Technician accepted job!',
        text: `Great news! Your technician has accepted the job and is reviewing details.`,
        notifType: 'booking',
        bookingId: booking._id.toString()
      });
    }

    if (status === 'completed' && req.user.role === 'technician') {
      if (tech) {
        tech.currentStatus = 'available';
        tech.currentJobId = null;
        tech.expectedAvailableTime = null;
        tech.jobsCompleted = (tech.jobsCompleted || 0) + 1;
        await tech.save();

        booking.status = 'completed';

        if (booking.paymentMethod === 'cash') {
          booking.paymentStatus = 'cash_pending';
        } else {
          booking.paymentStatus = 'awaiting_payment';
        }
      }
    }

    if (status === 'rejected' && req.user.role === 'technician') {
       booking.providerId = null;
       booking.providerPhone = null;
       booking.status = 'pending';
    }

    const updatedBooking = await booking.save();
    
    // Call Automated Notification System
    await triggerNotifications(req, updatedBooking, status);

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
    
    const User = require('../models/User');
    const techUser = await User.findById(providerId);

    booking.providerId = providerId;
    booking.providerEmail = techUser ? techUser.email : null;
    booking.providerPhone = techUser ? techUser.phone : null;
    booking.status = 'accepted';
    
    const updatedBooking = await booking.save();

    // Call Automated Notification
    await triggerNotifications(req, updatedBooking, 'accepted');

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
    
    if (req.user.role === 'user') {
      const isOwnerById = booking.userId && booking.userId.toString() === req.user.id.toString();
      if (!isOwnerById) {
         return res.status(403).json({ message: 'Not authorized to pay for this booking' });
      }
    } else if (req.user.role === 'technician') {
      const isProvider = booking.providerId && booking.providerId.toString() === req.user.id.toString();
      if (!isProvider) {
         return res.status(403).json({ message: 'Not authorized to confirm payment for this booking' });
      }
    }

    booking.paymentStatus = 'completed';
    booking.paymentMethod = paymentMethod || 'mock';
    booking.amount = amount || booking.finalQuote || 0;
    booking.transactionId = 'tx_' + Math.random().toString(36).substr(2, 9);

    const updatedBooking = await booking.save();

    // Credit technician's wallet upon completed payment
    await updateTechnicianWallet(updatedBooking);

    if (booking.providerEmail) {
      notifyUser({
        userId: booking.providerId,
        email: booking.providerEmail,
        type: 'both',
        subject: 'Payment Received!',
        text: `Customer has paid ₹${booking.amount} for the completed job.`,
        notifType: 'booking',
        bookingId: booking._id.toString()
      });
    }

    // Call Automated Notification System
    await triggerNotifications(req, updatedBooking, 'payment_completed');

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
    
    if (req.user.role === 'user') {
      const isOwnerById = booking.userId && booking.userId.toString() === req.user.id.toString();
      if (!isOwnerById) {
         return res.status(403).json({ message: 'Not authorized to create payment intent for this booking' });
      }
    }
    
    const amountStr = req.body.amount || booking.amount || 15;
    const amount = Math.max(50, Math.round(Number(amountStr) * 100));

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
  const { serviceCharge, sparePartsCost, transportCharge, quoteReason, quotePhoto, detectedIssues } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    if (req.user.role === 'technician' && booking.providerId !== req.user.id && !(booking.providerId?.startsWith('tech-'))) {
       return res.status(403).json({ message: 'Not authorized for this booking assignment' });
    }

    const sCharge = Number(serviceCharge || 0);
    const pCost = Number(sparePartsCost || 0);
    const tCharge = transportCharge !== undefined ? Number(transportCharge) : (booking.transportCharge || 50);
    const total = sCharge + pCost + tCharge;

    booking.serviceCharge = sCharge;
    booking.sparePartsCost = pCost;
    booking.transportCharge = tCharge;
    booking.finalQuote = total;
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
      text: `Your technician has diagnosed the issue and provided a final quote of ₹${total}. Please review and approve in the app.`,
      notifType: 'booking',
      bookingId: booking._id.toString()
    });

    // Call Automated Notification System
    await triggerNotifications(req, updatedBooking, 'quote_pending');

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
    
    const isOwnerById = booking.userId && booking.userId.toString() === req.user.id.toString();
    
    if (!isOwnerById) {
       return res.status(403).json({ message: 'Not authorized to approve quote' });
    }

    if (approved) {
      booking.quoteApproved = true;
      booking.status = 'quote_approved';
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
        text: approved ? 'The customer approved the quote. You may start the repair.' : 'The customer rejected your quote.',
        notifType: 'booking',
        bookingId: booking._id.toString()
      });
    }

    // Call Automated Notification System
    await triggerNotifications(req, updatedBooking, approved ? 'quote_approved' : 'rejected');

    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  const { reason } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    // Check authorization
    const isOwner = booking.userId && booking.userId.toString() === req.user.id.toString();
    const isTech = booking.providerId && booking.providerId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isTech && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }
    
    // Validate cancellation constraints
    if (req.user.role === 'user') {
      // Customer cancels before tech accepts, or can cancel any if needed, but track it
      // Let's allow cancellation but track status
    }
    
    booking.status = 'cancelled';
    booking.cancelledBy = req.user.role === 'user' ? 'customer' : (req.user.role === 'technician' ? 'technician' : 'admin');
    booking.cancellationReason = reason || 'No reason provided';
    booking.cancelledAt = new Date();
    
    // Free up technician if they were busy with this job
    if (booking.providerId) {
      const Technician = require('../models/Technician');
      const tech = await Technician.findOne({ userId: booking.providerId });
      if (tech && tech.currentJobId?.toString() === booking._id.toString()) {
        tech.currentStatus = 'available';
        tech.currentJobId = null;
        tech.expectedAvailableTime = null;
        await tech.save();
      }
    }
    
    const updatedBooking = await booking.save();
    
    // Trigger notification
    await triggerNotifications(req, updatedBooking, 'cancelled');
    
    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Helper to credit/debit technician wallet upon completed payment
const updateTechnicianWallet = async (booking) => {
  if (booking.walletUpdated) return;

  const Technician = require('../models/Technician');
  const tech = await Technician.findOne({ userId: booking.providerId });
  if (!tech) return;

  const bookingAmount = booking.finalQuote || (booking.serviceId?.price || 0);
  
  // Calculate discount if premium
  let isPremium = booking.isPremiumUser;
  if (booking.userId) {
    const User = require('../models/User');
    const userDoc = await User.findById(booking.userId);
    if (userDoc && userDoc.isPremium) {
      isPremium = true;
    }
  }

  let discount = 0;
  if (isPremium) {
    discount = bookingAmount * 0.15;
    booking.isPremiumUser = true;
    booking.discountPercentage = 15;
  }

  const customerPaid = bookingAmount - discount;
  const platformCommission = customerPaid * 0.10;
  const techShare = customerPaid * 0.90;

  booking.amount = customerPaid;
  booking.platformCommission = platformCommission;
  booking.membershipDiscount = discount;
  booking.finalTechnicianEarning = techShare;

  if (booking.paymentMethod === 'cash') {
    // Cash: Tech collects full cash directly. Deduct commission from their wallet balance.
    tech.walletBalance = (tech.walletBalance || 0) - platformCommission;
    tech.totalEarnings = (tech.totalEarnings || 0) + techShare;
  } else {
    // Razorpay: Client pays platform. Credit tech's wallet balance.
    tech.walletBalance = (tech.walletBalance || 0) + techShare;
    tech.totalEarnings = (tech.totalEarnings || 0) + techShare;
  }

  await tech.save();
  booking.walletUpdated = true;
  await booking.save();
};

module.exports = { createBooking, getBookings, updateBookingStatus, assignBooking, processPayment, createPaymentIntent, submitQuote, approveQuote, cancelBooking, updateTechnicianWallet, triggerNotifications };
