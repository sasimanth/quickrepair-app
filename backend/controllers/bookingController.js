const Booking = require('../models/Booking');
const { notifyUser } = require('../services/NotificationService');
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const normalizePhone = (phone) => {
  if (!phone) return null;
  return phone.replace(/\D/g, "").slice(-10);
};

const DispatchService = require('../services/DispatchService');

// AUTOMATED NOTIFICATION & CHAT MESSAGE HELPER
const triggerNotifications = async (req, booking, type) => {
  try {
    const Notification = require('../models/Notification');
    const Message = require('../models/Message');
    const io = global.io || (req && req.app ? req.app.get('io') : null);
    
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
        chatText = `📢 System: Technician ${techName} is en route.`;
        recipientId = booking.userId;
        break;
      case 'arrived':
        title = 'Technician Arrived! 🏡';
        message = `Technician ${techName} has arrived at your address.`;
        chatText = `📢 System: Technician ${techName} has arrived at the location.`;
        recipientId = booking.userId;
        break;
      case 'inspection_started':
        title = 'Inspection Started! 🔍';
        message = `Technician ${techName} has started inspecting your device.`;
        chatText = `📢 System: Technician ${techName} has started the diagnostic inspection.`;
        recipientId = booking.userId;
        break;
      case 'quote_pending':
        // Check if there is more than 1 revision to distinguish between first quote vs revision
        const isRevision = booking.quoteRevisions && booking.quoteRevisions.length > 1;
        title = isRevision ? 'Quote Updated – Please Review' : 'Action Required: Final Quote Received 📋';
        message = isRevision 
          ? `Technician ${techName} updated the quote to ₹${booking.finalQuote}. Reason: "${booking.quoteReason}"`
          : `Technician ${techName} has submitted a final quote of ₹${booking.finalQuote}. Please approve to proceed.`;
        chatText = isRevision
          ? `📢 System: Technician ${techName} sent quote revision V${booking.quoteRevisions.length} of ₹${booking.finalQuote}. Reason: "${booking.quoteReason}". Awaiting your approval.`
          : `📢 System: Technician ${techName} submitted a final quote of ₹${booking.finalQuote}. Please review and approve.`;
        recipientId = booking.userId;
        break;
      case 'quote_approved':
        title = 'Quote Approved! 🛠️';
        message = `You approved the quote. Repair work is now in progress.`;
        chatText = `📢 System: Customer approved the quote of ₹${booking.finalQuote}. Work in progress.`;
        recipientId = booking.providerId; // Notify tech
        break;
      case 'quote_rejected':
        title = 'Quote Proposal Declined ❌';
        message = `You declined the quote proposal. Repair work is suspended.`;
        chatText = `📢 System: Customer declined the quote proposal. Work is suspended until resolved.`;
        recipientId = booking.providerId; // Notify tech
        break;
      case 'quote_clarification':
        const lastRev = booking.quoteRevisions && booking.quoteRevisions[booking.quoteRevisions.length - 1];
        title = 'Clarification Requested 💬';
        message = `Customer requested details: "${lastRev ? lastRev.clarificationText : ''}"`;
        chatText = `📢 System: Customer requested clarification: "${lastRev ? lastRev.clarificationText : ''}"`;
        recipientId = booking.providerId; // Notify tech
        break;
      case 'completed':
        title = 'Repair Job Completed! 🎉';
        message = `Your technician marked the job as completed. Thank you!`;
        chatText = `📢 System: Service marked as completed. Awaiting payment checkout.`;
        recipientId = booking.userId;
        break;
      case 'cash_pending':
        title = 'Cash Payment Requested 💵';
        message = `Customer requested to pay ₹${booking.amount} in cash. Please confirm receipt upon collection.`;
        chatText = `📢 System: Customer selected Direct Cash Payment. Awaiting technician confirmation.`;
        recipientId = booking.providerId; // Notify tech
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

    // 1. Create DB Notification and Web Push for recipient (if valid user ID)
    if (recipientId && !recipientId.startsWith('tech-')) {
      const notifType = ['accepted', 'rejected', 'on_the_way', 'arrived', 'inspection_started'].includes(type) ? 'booking' : 'system';
      const User = require('../models/User');
      const recipientUser = await User.findById(recipientId);
      const { notifyUser } = require('../services/NotificationService');
      
      await notifyUser({
        userId: recipientId,
        email: recipientUser?.email || null,
        phone: recipientUser?.phone || null,
        type: 'push',
        subject: title,
        text: message,
        notifType,
        bookingId: booking._id.toString()
      });
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
      const initiatorId = req && req.user ? (req.user._id || req.user.id) : null;
      const initiatorRole = req && req.user ? req.user.role : null;
      
      const payload = typeof booking.toObject === 'function' ? booking.toObject() : { ...booking };
      payload.initiatorId = initiatorId;
      payload.initiatorRole = initiatorRole;

      // Refresh User Dashboard
      if (booking.userId) {
        io.to(`user_${booking.userId}`).emit('job_update', payload);
      }
      // Refresh Tech Dashboard
      if (booking.providerId) {
        io.to(`user_${booking.providerId}`).emit('job_update', payload);
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

    let parsedDate = date ? new Date(date) : new Date();
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date();
    }

    // DUPLICATE SUBMISSION CHECK (Within last 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const duplicateQuery = {
      serviceId: serviceId || null,
      createdAt: { $gte: twoMinutesAgo }
    };
    if (bookingUserId) {
      duplicateQuery.$or = [
        { userId: bookingUserId },
        { phone: finalPhone }
      ];
    } else {
      duplicateQuery.phone = finalPhone;
    }
    const duplicate = await Booking.findOne(duplicateQuery);

    if (duplicate) {
      return res.status(409).json({ message: 'Duplicate booking detected. Please wait 2 minutes before resubmitting.' });
    }

    // RISK SCORING & CANCELLATION ABUSE CHECK
    if (req.user) {
      const userBookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(3);
      const consecutiveCancellations = userBookings.length === 3 && userBookings.every(b => b.status === 'cancelled');
      if (consecutiveCancellations) {
        // Log a security alert for cancellation abuse
        const SecurityAlert = require('../models/SecurityAlert');
        await SecurityAlert.create({
          userId: req.user._id,
          userEmail: req.user.email,
          alertType: 'CANCELLATION_ABUSE',
          severity: 'high',
          description: `User ${req.user.email} flagged for booking cancellation abuse (last 3 bookings cancelled).`,
          metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
        });

        // Enforce prepayment if they choose cash on a direct repair booking
        if (serviceOption !== 'inspection' && (req.body.paymentMethod === 'cash' || !req.body.paymentMethod)) {
          return res.status(400).json({ 
            message: 'Due to repeated booking cancellations, the cash payment option is temporarily disabled for your account. Please pay online to request a service.' 
          });
        }
      }
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

    const reqTimeSlot = timeSlot || 'ASAP';
    let finalProviderId = providerId || null;
    let bStatus = 'pending';
    let assignedTechEmail = 'technician@fixvo.com';
    let assignedTechPhone = null;

    if (finalProviderId) {
      bStatus = 'assigned'; // Manually assigned -> pending acceptance
      const Technician = require('../models/Technician');
      const assignedTech = await Technician.findOne({ userId: finalProviderId });
      if (assignedTech) {
        assignedTechEmail = assignedTech.email;
        const User = require('../models/User');
        const techUserDoc = await User.findById(finalProviderId);
        assignedTechPhone = assignedTech.phone || techUserDoc?.phone || null;
      }
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
      date: parsedDate,
      deviceType: deviceType || service || 'Unknown Device',
      problemDescription: problemDescription || problem || 'Not Specified',
      problemId: problemId || null,
      problemIds: problemIds || [],
      location: finalAddress,
      landmark: landmark || null,
      latitude: gpsLocation && gpsLocation.lat ? parseFloat(gpsLocation.lat) : null,
      longitude: gpsLocation && gpsLocation.lng ? parseFloat(gpsLocation.lng) : null,
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
      discountPercentage: isPremiumUser ? 5 : (discountPercentage || 0),
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

    // If manually assigned (technician selected by user)
    if (finalProviderId && !finalProviderId.startsWith('tech-')) {
      if (global.io) {
        global.io.to(`user_${finalProviderId}`).emit('new_job', createdBooking.toObject());
      }
      
      await notifyUser({
        userId: finalProviderId,
        email: assignedTechEmail,
        phone: assignedTechPhone,
        type: 'both',
        subject: 'New Job Assigned! 💼',
        text: `New repair request for ${booking.serviceName} at ${finalAddress}.`,
        notifType: 'booking',
        bookingId: booking._id.toString()
      });
      
      const Notification = require('../models/Notification');
      const techNotif = await Notification.findOne({
        userId: finalProviderId,
        bookingId: booking._id.toString()
      }).sort({ createdAt: -1 });

      if (global.io && techNotif) {
        global.io.to(`user_${finalProviderId}`).emit('new_notification', techNotif);
        global.io.to(`user_${bookingUserId}`).emit('job_update', createdBooking.toObject());
      }

      // Start dispatch loop with manual assignment
      DispatchService.startDispatch(createdBooking._id);
    } else {
      // Run smart auto-assignment asynchronously
      DispatchService.startDispatch(createdBooking._id);
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
    console.error("❌ createBooking Failure Details:", {
      error: error.message,
      stack: error.stack,
      body: req.body,
      user: req.user
    });
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
      DispatchService.cancelDispatch(booking._id);
      booking.providerEmail = req.user.email;
      booking.providerId = req.user.id; // Fully bind technician
      booking.rejectionReason = null;
      booking.rejectedByTechName = null;
      const User = require('../models/User');
      const techUser = await User.findById(req.user.id);
      if (tech) {
        tech.currentStatus = 'on_job'; // Auto-set status to On Job
        tech.currentJobId = booking._id;
        tech.expectedAvailableTime = new Date(Date.now() + 90 * 60000); 
        await tech.save();
        booking.providerPhone = tech.phone || techUser?.phone || null;
      } else {
        booking.providerPhone = techUser?.phone || null;
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
        tech.currentStatus = 'available'; // Return to Available
        tech.currentJobId = null;
        tech.expectedAvailableTime = null;
        tech.jobsCompleted = (tech.jobsCompleted || 0) + 1;
        await tech.save();

        booking.status = 'completed';
        // Always default completed jobs to awaiting_payment so customers can select cash or online checkout
        booking.paymentStatus = 'awaiting_payment';
      }
    }

    if (status === 'rejected' && req.user.role === 'technician') {
       const reason = req.body.rejectionReason || 'No reason specified';
       booking.rejectedTechnicians = booking.rejectedTechnicians || [];
       if (!booking.rejectedTechnicians.includes(req.user.id)) {
         booking.rejectedTechnicians.push(req.user.id);
       }
       booking.rejectionReason = reason;
       booking.rejectedByTechName = tech ? tech.name : (req.user.name || 'Technician');
       booking.providerId = null;
       booking.providerPhone = null;
       booking.providerEmail = null;
       booking.status = 'pending';
       if (tech) {
          tech.currentStatus = 'available'; // Return to Available
         tech.currentJobId = null;
         await tech.save();
       }

       const savedBooking = await booking.save();
       
       if (global.io) {
         global.io.to(`user_${booking.userId}`).emit('job_rejected', {
           bookingId: booking._id.toString(),
           rejectedByTechName: booking.rejectedByTechName,
           rejectionReason: booking.rejectionReason
         });
         global.io.to(`user_${booking.userId}`).emit('job_update', savedBooking.toObject());
       }

       const { notifyUser } = require('../services/NotificationService');
       await notifyUser({
         userId: booking.userId,
         email: booking.userEmail,
         type: 'both',
         subject: 'Technician Declined – Reassigning 🔄',
         text: `Technician ${booking.rejectedByTechName} declined your booking request (Reason: ${booking.rejectionReason}). Reassigning to another nearby technician...`,
         notifType: 'booking',
         bookingId: booking._id.toString()
       });

       await DispatchService.startDispatch(booking._id);

       const finalBooking = await Booking.findById(booking._id).populate('serviceId', 'name price');
       await triggerNotifications(req, finalBooking, 'rejected');

       return res.json(finalBooking);
    }

    const updatedBooking = await booking.save();
    await updatedBooking.populate('serviceId', 'name price');
    
    if (status === 'completed' && req.user.role === 'technician') {
      await updateTechnicianWallet(updatedBooking);
    }
    
    // Call Automated Notification System
    await triggerNotifications(req, updatedBooking, status);

    const enrichedArr = await enrichBookingsWithChat([updatedBooking], req.user.id);
    res.json(enrichedArr[0] || updatedBooking);
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
    await updatedBooking.populate('serviceId', 'name price');

    // Call Automated Notification
    await triggerNotifications(req, updatedBooking, 'accepted');

    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Process a mock/cash payment for a booking
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

      if (paymentMethod === 'cash') {
        booking.paymentStatus = 'cash_pending';
        booking.paymentMethod = 'cash';
        booking.amount = amount || booking.finalQuote || 0;
        
        const updatedBooking = await booking.save();
        await updatedBooking.populate('serviceId', 'name price');
        
        // Notify technician to confirm cash receipt
        await triggerNotifications(req, updatedBooking, 'cash_pending');
        return res.json(updatedBooking);
      } else {
        // Prevent frontend from self-authorizing mock online payments
        return res.status(400).json({ 
          message: 'Insecure online payment request. Online payment statuses must be verified server-side through secure payment gateway signatures.' 
        });
      }
    } else if (req.user.role === 'technician') {
      const isProvider = booking.providerId && booking.providerId.toString() === req.user.id.toString();
      if (!isProvider) {
         return res.status(403).json({ message: 'Not authorized to confirm payment for this booking' });
      }

      // Tech confirming receipt of cash payment
      booking.paymentStatus = 'completed';
      booking.paymentMethod = 'cash';
      booking.amount = amount || booking.finalQuote || 0;
      booking.transactionId = 'tx_cash_' + Math.random().toString(36).substr(2, 9);

      const updatedBooking = await booking.save();
      await updatedBooking.populate('serviceId', 'name price');

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

      return res.json(updatedBooking);
    }
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

    const existingRevisions = booking.quoteRevisions || [];
    const isRevision = existingRevisions.length > 0 || booking.finalQuote !== null;

    if (isRevision) {
      // 1. Revision notes are mandatory
      if (!quoteReason || !quoteReason.trim()) {
        return res.status(400).json({ message: 'Revision reason/notes are mandatory for modifying an existing quote.' });
      }

      // 2. Maximum revision count is 3
      if (existingRevisions.length >= 3) {
        return res.status(400).json({ message: 'Maximum quote revision limit (3) reached. Cannot modify further.' });
      }
    }

    const nextVersion = existingRevisions.length + 1;

    // Push new revision to log
    booking.quoteRevisions.push({
      version: nextVersion,
      serviceCharge: sCharge,
      sparePartsCost: pCost,
      transportCharge: tCharge,
      finalQuote: total,
      quoteReason: quoteReason || 'Initial diagnostic quote',
      detectedIssues,
      quotePhoto,
      status: 'pending',
      createdAt: new Date()
    });

    // Save previous status to preRevisionStatus if we are currently working
    if (booking.status === 'in_progress') {
      booking.preRevisionStatus = 'in_progress';
    } else if (booking.status === 'quote_approved') {
      booking.preRevisionStatus = 'quote_approved';
    }

    booking.serviceCharge = sCharge;
    booking.sparePartsCost = pCost;
    booking.transportCharge = tCharge;
    booking.finalQuote = total;
    booking.quoteReason = quoteReason;
    booking.detectedIssues = detectedIssues;
    booking.quotePhoto = quotePhoto;
    
    // Move booking back to quote_pending
    booking.status = 'quote_pending';
    booking.quoteApproved = false;

    const updatedBooking = await booking.save();
    await updatedBooking.populate('serviceId', 'name price');
    
    notifyUser({
      userId: booking.userId,
      email: booking.userEmail,
      type: 'both',
      subject: isRevision ? `Quote Updated – Please Review` : 'Action Required: Approve Final Quote',
      text: isRevision 
        ? `Your technician updated the quote to ₹${total} (Reason: ${quoteReason}). Please review and approve.`
        : `Your technician has diagnosed the issue and provided a final quote of ₹${total}. Please review and approve in the app.`,
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

    const lastRevision = booking.quoteRevisions && booking.quoteRevisions.length > 0
      ? booking.quoteRevisions[booking.quoteRevisions.length - 1]
      : null;

    if (approved) {
      booking.quoteApproved = true;
      booking.status = booking.preRevisionStatus || 'quote_approved';
      booking.preRevisionStatus = null;

      if (lastRevision) {
        lastRevision.status = 'approved';
        lastRevision.approvedAt = new Date();
      }
    } else {
      booking.quoteApproved = false;
      booking.status = 'quote_rejected';

      if (lastRevision) {
        lastRevision.status = 'rejected';
        lastRevision.rejectedAt = new Date();
      }
    }

    const updatedBooking = await booking.save();
    await updatedBooking.populate('serviceId', 'name price');

    if (booking.providerEmail) {
      notifyUser({
        userId: booking.providerId,
        email: booking.providerEmail,
        type: 'both',
        subject: approved ? 'Quote Approved!' : 'Quote Rejected by Customer',
        text: approved 
          ? 'The customer approved the quote. You may start/continue the repair.' 
          : 'The customer rejected your quote. Work is suspended until resolved.',
        notifType: 'booking',
        bookingId: booking._id.toString()
      });
    }

    // Call Automated Notification System
    await triggerNotifications(req, updatedBooking, approved ? 'quote_approved' : 'quote_rejected');

    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Request quote clarification (Customer)
// @route   PUT /api/bookings/:id/clarify-quote
const requestQuoteClarification = async (req, res) => {
  const { clarificationText } = req.body;
  if (!clarificationText || !clarificationText.trim()) {
    return res.status(400).json({ message: 'Clarification text is required' });
  }

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwnerById = booking.userId && booking.userId.toString() === req.user.id.toString();
    if (!isOwnerById) return res.status(403).json({ message: 'Not authorized' });

    const lastRevision = booking.quoteRevisions && booking.quoteRevisions.length > 0
      ? booking.quoteRevisions[booking.quoteRevisions.length - 1]
      : null;

    if (!lastRevision || (lastRevision.status !== 'pending' && lastRevision.status !== 'clarification_requested')) {
      return res.status(400).json({ message: 'No pending quote version found to clarify.' });
    }

    lastRevision.status = 'clarification_requested';
    lastRevision.clarificationText = clarificationText;
    booking.status = 'quote_clarification';

    const Message = require('../models/Message');
    const io = global.io;

    const chatMsg = await Message.create({
      bookingId: booking._id,
      senderId: 'system',
      senderName: 'System',
      text: `📢 Clarification Query: Customer requested explanation on the quote revision: "${clarificationText}"`
    });

    if (io) {
      io.to(`chat_${booking._id}`).emit('receive_message', chatMsg);
    }

    const updatedBooking = await booking.save();
    await updatedBooking.populate('serviceId', 'name price');

    if (booking.providerEmail) {
      notifyUser({
        userId: booking.providerId,
        email: booking.providerEmail,
        type: 'both',
        subject: 'Action Required: Clarification Requested',
        text: `Customer requested clarification on your quote: "${clarificationText}". Please review and respond.`,
        notifType: 'booking',
        bookingId: booking._id.toString()
      });
    }

    await triggerNotifications(req, updatedBooking, 'quote_clarification');

    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Respond to quote clarification (Technician)
// @route   PUT /api/bookings/:id/respond-quote
const respondQuoteClarification = async (req, res) => {
  const { responseText } = req.body;
  if (!responseText || !responseText.trim()) {
    return res.status(400).json({ message: 'Response text is required' });
  }

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.providerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const lastRevision = booking.quoteRevisions && booking.quoteRevisions.length > 0
      ? booking.quoteRevisions[booking.quoteRevisions.length - 1]
      : null;

    if (!lastRevision || lastRevision.status !== 'clarification_requested') {
      return res.status(400).json({ message: 'No active clarification request found.' });
    }

    lastRevision.status = 'pending';
    lastRevision.clarificationResponse = responseText;
    booking.status = 'quote_pending';

    const Message = require('../models/Message');
    const io = global.io;

    const chatMsg = await Message.create({
      bookingId: booking._id,
      senderId: 'system',
      senderName: 'System',
      text: `📢 Tech Response: "${responseText}"`
    });

    if (io) {
      io.to(`chat_${booking._id}`).emit('receive_message', chatMsg);
    }

    const updatedBooking = await booking.save();
    await updatedBooking.populate('serviceId', 'name price');

    notifyUser({
      userId: booking.userId,
      email: booking.userEmail,
      type: 'both',
      subject: 'Quote Explanation Received',
      text: `Your technician responded to your clarification query: "${responseText}". Please review the quote again.`,
      notifType: 'booking',
      bookingId: booking._id.toString()
    });

    await triggerNotifications(req, updatedBooking, 'quote_pending');

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
    DispatchService.cancelDispatch(booking._id);
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
    await updatedBooking.populate('serviceId', 'name price');
    
    // Trigger notification
    await triggerNotifications(req, updatedBooking, 'cancelled');
    
    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Helper to credit/debit technician wallet upon completed payment
const updateTechnicianWallet = async (booking) => {
  const Technician = require('../models/Technician');
  const tech = await Technician.findOne({ userId: booking.providerId });
  if (!tech) return;

  if (!booking.walletUpdated) {
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
      discount = bookingAmount * 0.05;
      booking.isPremiumUser = true;
      booking.discountPercentage = 5;
    } else {
      booking.discountPercentage = 0;
    }

    const customerPaid = bookingAmount - discount;
    const platformCommission = customerPaid * 0.10;
    const techShare = customerPaid * 0.90;

    booking.amount = customerPaid;
    booking.platformCommission = platformCommission;
    booking.membershipDiscount = discount;
    booking.finalTechnicianEarning = techShare;
    booking.walletUpdated = true;
    
    // Log split details to internal database payout ledger
    const PayoutLog = require('../models/PayoutLog');
    try {
      await PayoutLog.create({
        bookingId: booking._id,
        technicianId: tech.userId,
        totalAmount: customerPaid,
        techShare,
        platformFee: platformCommission,
        paymentMethod: booking.paymentMethod || 'cash',
        gatewayStatus: 'completed',
        transactionId: booking.transactionId || `mock-tx-${Date.now()}`,
        transferStatus: 'logged'
      });
      console.log(`[Ledger] Logged 90/10 split for booking ${booking._id}: techShare ₹${techShare}, platformFee ₹${platformCommission}`);
    } catch (ledgerErr) {
      console.error('[Ledger] Failed to write split to PayoutLog:', ledgerErr);
    }

    await booking.save();
  }

  // Recalculate wallet stats dynamically using completed bookings logs
  const Booking = require('../models/Booking');
  const WithdrawalRequest = require('../models/WithdrawalRequest');
  
  const bookings = await Booking.find({ providerId: tech.userId });
  const completedBookings = bookings.filter(b => b.status === 'completed');
  
  const grossEarnings = completedBookings.reduce((sum, b) => sum + (b.finalQuote || b.amount || 0), 0);
  const platformFee = grossEarnings * 0.10;
  const netEarnings = grossEarnings - platformFee;

  const cashBookings = completedBookings.filter(b => b.paymentMethod === 'cash' && b.paymentStatus === 'completed');
  const cashCollected = cashBookings.reduce((sum, b) => sum + (b.finalQuote || b.amount || 0), 0);
  const platformDue = cashCollected * 0.10;

  const onlineBookings = completedBookings.filter(b => b.paymentMethod !== 'cash' && b.paymentStatus === 'completed');
  const onlinePayments = onlineBookings.reduce((sum, b) => sum + (b.finalQuote || b.amount || 0), 0);

  const withdrawals = await WithdrawalRequest.find({ technicianId: tech.userId });
  const withdrawn = withdrawals.filter(w => w.status === 'paid').reduce((sum, w) => sum + w.amount, 0);
  const pendingWithdrawal = withdrawals.filter(w => w.status === 'pending' || w.status === 'approved').reduce((sum, w) => sum + w.amount, 0);

  const availableBalance = Math.max(0, (onlinePayments * 0.90) - platformDue - withdrawn - pendingWithdrawal);

  tech.walletBalance = availableBalance;
  tech.totalEarnings = netEarnings;
  tech.withdrawnAmount = withdrawn;
  tech.pendingWithdrawal = pendingWithdrawal;
  await tech.save();
};

module.exports = { createBooking, getBookings, updateBookingStatus, assignBooking, processPayment, createPaymentIntent, submitQuote, approveQuote, cancelBooking, updateTechnicianWallet, triggerNotifications, requestQuoteClarification, respondQuoteClarification };
