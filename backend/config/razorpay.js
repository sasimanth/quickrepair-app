const Razorpay = require("razorpay");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_change_me",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_secret_change_me",
});

module.exports = razorpay;
