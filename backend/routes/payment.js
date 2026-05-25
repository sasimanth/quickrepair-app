const express = require("express");
const router = express.Router();
const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const { protect } = require("../middleware/auth");

// Create Razorpay Order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, bookingId } = req.body;
    const options = {
      amount: Math.max(parseInt(amount || 1) * 100, 100), // Ensure minimum ₹1 (100 paise) to prevent Razorpay 400 Error
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    
    if (bookingId) {
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        { paymentStatus: 'awaiting_payment', paymentMethod: 'razorpay' },
        { new: true }
      ).populate('serviceId', 'name price');

      const io = req.app.get('io');
      if (io && updatedBooking) {
        const payload = typeof updatedBooking.toObject === 'function' ? updatedBooking.toObject() : { ...updatedBooking };
        payload.initiatorId = req.user ? (req.user._id || req.user.id) : updatedBooking.userId;
        payload.initiatorRole = req.user ? req.user.role : 'user';

        if (updatedBooking.userId) {
          io.to(`user_${updatedBooking.userId}`).emit('job_update', payload);
        }
        if (updatedBooking.providerId) {
          io.to(`user_${updatedBooking.providerId}`).emit('job_update', payload);
        }
      }
    }

    res.json(order);
  } catch (err) {
    console.log(err); // 👈 Adding this so you can see the exact Razorpay error in your terminal!
    res.status(400).json({ error: "Error creating order", details: err });
  }
});

// Verify Payment
router.post("/verify", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "rzp_secret_change_me")
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    // Payment is verified
    try {
      if (bookingId) {
        const booking = await Booking.findById(bookingId);
        if (booking) {
          booking.paymentStatus = "completed";
          booking.paymentMethod = "razorpay";
          booking.transactionId = razorpay_payment_id;
          await booking.save();

          const { updateTechnicianWallet, triggerNotifications } = require("../controllers/bookingController");
          if (updateTechnicianWallet) {
            await updateTechnicianWallet(booking);
          }
          if (triggerNotifications) {
            await triggerNotifications(req, booking, 'payment_completed');
          }
        }
      }
      res.json({ success: true, message: "Payment verified successfully" });
    } catch(err) {
      console.error("Error updating booking status", err);
      res.status(500).json({ success: false, message: "Payment verified but failed to update booking" });
    }
  } else {
    res.status(400).json({ success: false, message: "Invalid signature" });
  }
});

// Verify Premium Payment
router.post("/verify-premium", protect, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "rzp_secret_change_me")
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    try {
      const User = require("../models/User");
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      user.isPremium = true;
      user.membershipType = plan === 'monthly' ? 'monthly' : 'yearly';
      user.membershipActiveDate = new Date();
      
      const expiry = new Date();
      if (user.membershipType === 'monthly') {
        expiry.setMonth(expiry.getMonth() + 1);
      } else {
        expiry.setFullYear(expiry.getFullYear() + 1);
      }
      user.membershipExpiry = expiry;
      
      // Initialize benefits tracking if empty
      user.premiumBenefits = {
        inspectionsUsed: user.premiumBenefits?.inspectionsUsed || 0,
        totalSaved: user.premiumBenefits?.totalSaved || 0
      };

      await user.save();

      res.json({ 
        success: true, 
        message: "Successfully upgraded to premium", 
        isPremium: user.isPremium, 
        membershipType: user.membershipType, 
        membershipExpiry: user.membershipExpiry,
        membershipActiveDate: user.membershipActiveDate,
        premiumBenefits: user.premiumBenefits
      });
    } catch(err) {
      console.error("Error updating user premium status", err);
      res.status(500).json({ success: false, message: "Payment verified but failed to update user profile" });
    }
  } else {
    res.status(400).json({ success: false, message: "Invalid signature" });
  }
});

module.exports = router;
