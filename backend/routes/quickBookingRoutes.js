const express = require('express');
const router = express.Router();
const QuickBooking = require('../models/QuickBooking');
const Technician = require('../models/Technician');
const nodemailer = require('nodemailer');
const axios = require('axios');

// POST /api/book-service
router.post('/', async (req, res) => {
  try {
    const { name, phone, service, problem, address } = req.body;

    // 1. Basic validation
    if (!name || !phone || !service || !problem || !address) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // 2. SMART AUTO-ASSIGNMENT & QUEUE LOGIC
    let techName = "Unassigned";
    let techPhone = "N/A";
    let bookingStatus = "Pending";
    let estArrival = null;
    let isQueued = false;
    let reqTimeSlot = req.body.timeSlot || 'ASAP';

    // Find available technicians
    const availableTech = await Technician.findOne({ currentStatus: { $in: ['online', 'available'] }, isOnline: true });
    
    if (availableTech) {
      techName = availableTech.name;
      techPhone = availableTech.phone || "+15551234567"; // Fallback phone format
      bookingStatus = "Assigned";
      estArrival = new Date(Date.now() + 30 * 60000); // Expect in ~30 mins
    } else {
      // Queue System: Find busy tech finishing earliest
      const busyTech = await Technician.findOne({ currentStatus: { $in: ['busy', 'on_the_way', 'on_job'] }, isOnline: true }).sort('expectedAvailableTime');
      
      if (busyTech) {
        techName = busyTech.name;
        techPhone = busyTech.phone || "+15551234567";
        bookingStatus = "Queued";
        isQueued = true;
        // Calculate when they are free + 30 mins travel
        const baseTime = busyTech.expectedAvailableTime ? busyTech.expectedAvailableTime.getTime() : Date.now() + 60 * 60000;
        estArrival = new Date(baseTime + 30 * 60000);
      } else {
        bookingStatus = "Pending"; // No one online
      }
    }

    // 3. Store Data to MongoDB (PRIMARY STORAGE)
    const newBooking = new QuickBooking({
      name,
      phone,
      service,
      problem,
      address,
      technicianName: techName,
      technicianPhone: techPhone,
      status: bookingStatus,
      timeSlot: reqTimeSlot,
      estimatedArrivalTime: estArrival,
      isQueued: isQueued,
      price: null // Update later based on quote
    });
    
    // Attempt save to Mongo FIRST - if this fails, the block enters catch() and fails early
    const savedBooking = await newBooking.save();

    // 4. Google Sheets Integration (SECONDARY STORAGE)
    const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL || 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
    if (GAS_WEB_APP_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      try {
        await axios.post(GAS_WEB_APP_URL, {
          name,
          phone,
          service,
          problem,
          address,
          assignedTech: techName,
          techPhone: techPhone,
          status: bookingStatus,
          price: ""
        });
        console.log('Record successfully pushed to Google Sheets.');
      } catch (sheetErr) {
        // DO NOT BREAK BOOKING FLOW - Log the error only
        console.error('Failed to save to Google Sheets:', sheetErr.message);
      }
    }

    // 5. WhatsApp / Email Notification To Admin (Optional Enhancements)
    try {
      // NOTE: Pseudo-code for WhatsApp Integration using a provider like Twilio/Meta:
      // await sendWhatsApp(techPhone, `New Job: ${service} at ${address}`);
      
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
          subject: 'New Fixvo Booking! (Assigned)',
          text: `New Booking Received:\n\nName: ${name}\nPhone: ${phone}\nService: ${service}\nProblem: ${problem}\nAddress: ${address}\nAssigned To: ${techName}\nDate: ${new Date().toLocaleString()}`,
        };

        await transporter.sendMail(mailOptions);
        console.log('Admin email sent successfully.');
      }
    } catch (notifErr) {
      console.error('Notification failed (email/WA):', notifErr);
    }

    // 6. Response to Frontend
    res.status(200).json({ 
      success: true, 
      message: 'Booking confirmed!',
      bookingId: savedBooking._id
    });
  } catch (error) {
    console.error('Error in /api/book-service:', error);
    // If MongoDB fails, it lands here.
    res.status(500).json({ success: false, message: 'Server error processing booking.' });
  }
});

module.exports = router;
