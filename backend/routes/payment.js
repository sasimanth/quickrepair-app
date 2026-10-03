const express = require("express");
const router = express.Router();
const razorpay = require("../config/razorpay");
const { handleWebhook } = require("../controllers/razorpayController");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const { protect, authorize } = require("../middleware/auth");
const { confirmCashPayment } = require("../controllers/cashPaymentController");

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

    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_SdKZzH37k0xhIv";
    res.json({
      ...(typeof order.toObject === 'function' ? order.toObject() : order),
      key: keyId,
      keyId: keyId
    });
  } catch (err) {
    console.error('[payment] Create order error:', err.message);
    res.status(400).json({ error: "Error creating order", details: err.message });
  }
});

// Verify Payment
router.post("/verify", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  // Idempotency/Replay attack prevention
  if (razorpay_payment_id) {
    const existingTx = await Booking.findOne({ transactionId: razorpay_payment_id });
    if (existingTx) {
      const SecurityAlert = require("../models/SecurityAlert");
      await SecurityAlert.create({
        alertType: 'PAYMENT_ANOMALY',
        severity: 'high',
        description: `Duplicate Razorpay payment ID detected: ${razorpay_payment_id}. Replay attack blocked.`,
        metadata: { razorpay_payment_id, bookingId, ipAddress: req.ip }
      });
      return res.status(400).json({ success: false, message: "Duplicate transaction ID. Payment verification failed." });
    }
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(body.toString())
    .digest("hex");

  // SECURITY: use timing-safe comparison to prevent timing-oracle attacks
  let signaturesMatch = false;
  try {
    signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(razorpay_signature || '', 'hex')
    );
  } catch {
    // Buffer.from will throw if hex string is malformed — treat as mismatch
    signaturesMatch = false;
  }

  if (signaturesMatch) {
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

  // Idempotency/Replay check
  if (razorpay_payment_id) {
    const SecurityAlert = require("../models/SecurityAlert");
    const existingPremium = await SecurityAlert.findOne({
      alertType: 'PREMIUM_UPGRADE_TRANSACTION',
      'metadata.razorpay_payment_id': razorpay_payment_id
    });
    if (existingPremium) {
      await SecurityAlert.create({
        alertType: 'PAYMENT_ANOMALY',
        severity: 'high',
        description: `Duplicate Razorpay Premium payment ID detected: ${razorpay_payment_id}. Replay attack blocked.`,
        metadata: { razorpay_payment_id, userId: req.user.id, ipAddress: req.ip }
      });
      return res.status(400).json({ success: false, message: "Duplicate transaction ID. Payment verification failed." });
    }
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "rzp_secret_change_me")
    .update(body.toString())
    .digest("hex");

  const expectedBuf = Buffer.from(expectedSignature, "utf8");
  const receivedBuf = Buffer.from(razorpay_signature || "", "utf8");
  const isValidSignature = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

  if (isValidSignature) {
    try {
      const User = require("../models/User");
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Log successful transaction for future idempotency checks
      const SecurityAlert = require("../models/SecurityAlert");
      await SecurityAlert.create({
        userId: user._id,
        userEmail: user.email,
        alertType: 'PREMIUM_UPGRADE_TRANSACTION',
        severity: 'low',
        description: `User successfully upgraded to premium: ${plan}.`,
        metadata: { razorpay_payment_id, plan, ipAddress: req.ip }
      });

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

// Razorpay Webhook endpoint
router.post('/razorpay/webhook', handleWebhook);
router.post('/cash/confirm', protect, authorize('technician'), confirmCashPayment);

module.exports = router;
