const express = require("express");
const router = express.Router();
const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Booking = require("../models/Booking"); // Make sure to update the booking

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
    
    // Optionally update booking with razorpay order id if doing payment before tech completes (or after)
    // if (bookingId) {
    //   await Booking.findByIdAndUpdate(bookingId, { transactionId: order.id });
    // }

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
        await Booking.findByIdAndUpdate(bookingId, {
          paymentStatus: "completed",
          paymentMethod: "razorpay",
          transactionId: razorpay_payment_id,
        });
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

module.exports = router;
