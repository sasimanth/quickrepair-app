const express = require('express');
const router = express.Router();
const { 
  signup, login, logoutUser, getMe, createAdmin, 
  verifyEmail, verifyOtp, resendVerification, verifyCaptcha, googleAuth 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginLimiter, signupLimiter, otpLimiter } = require('../middleware/rateLimiter');

router.post('/signup', signupLimiter, signup);
router.post('/login', loginLimiter, login);
router.post('/google', googleAuth);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.post('/create-admin', createAdmin);

// New Verification Endpoints
router.post('/verify-email', verifyEmail);
router.post('/verify-otp', verifyOtp);
router.post('/resend-verification', otpLimiter, resendVerification);
router.post('/captcha-verify', verifyCaptcha);

module.exports = router;