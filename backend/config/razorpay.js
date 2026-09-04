const Razorpay = require("razorpay");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_SdKZzH37k0xhIv",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "QxxpseKMRQaSOa7qQoyeyr69",
});

module.exports = razorpay;
