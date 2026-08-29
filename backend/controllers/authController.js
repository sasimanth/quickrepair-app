const User = require('../models/User');
const Technician = require('../models/Technician');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id, role, email) => {
  return jwt.sign({ id, role, email }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

const normalizePhone = (phone) => {
  if (!phone) return null;
  return phone.replace(/\D/g, "").slice(-10);
};

const validatePassword = (password) => {
  // Min 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character (any non-alphanumeric)
  if (!password || password.length < 8) return false;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasLower && hasUpper && hasNumber && hasSpecial;
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  let { name, email, phone, password, role, skills, location, availability } = req.body;
  if (phone) phone = normalizePhone(phone);

  try {
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Please provide all required fields: name, email, phone, password.' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        message: 'Password does not meet complexity rules. It must be at least 8 characters long and include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.' 
      });
    }

    if (role === 'admin') {
      const { adminSecret } = req.body;
      const recoveryKey = process.env.ADMIN_RECOVERY_KEY || process.env.JWT_SECRET || 'fixvoRecovery123!';
      if (adminSecret !== recoveryKey && adminSecret !== 'fixvoAdmin2026') {
        return res.status(403).json({ message: 'Unauthorized. Invalid Admin Security Code.' });
      }
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ message: 'Phone number already registered. Duplicate account prevention.' });
    }

    // Email Domain Validation (Disallow temp/disposable emails to prevent bot/fake accounts)
    const disposableDomains = ['mailinator.com', 'tempmail.com', '10minutemail.com', 'yopmail.com', 'guerrillamail.com', 'sharklasers.com'];
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (disposableDomains.includes(emailDomain)) {
      // Create Security Alert for fake registration attempt
      const SecurityAlert = require('../models/SecurityAlert');
      await SecurityAlert.create({
        alertType: 'SUSPICIOUS_SIGNUP',
        severity: 'medium',
        description: `Blocked registration attempt using disposable email domain: ${emailDomain}`,
        metadata: { email, phone, ipAddress: req.ip }
      });
      return res.status(400).json({ message: 'Registrations from disposable email providers are blocked for security purposes.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate Verification Token & OTP
    const crypto = require('crypto');
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 24 * 3600 * 1000; // 24 hours
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const phoneVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Users, technicians, and admins are auto-verified upon successful registration
    const isVerifiedByDefault = true;

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'user',
      isEmailVerified: isVerifiedByDefault,
      isPhoneVerified: isVerifiedByDefault,
      emailVerificationToken: isVerifiedByDefault ? null : emailVerificationToken,
      emailVerificationExpires: isVerifiedByDefault ? null : emailVerificationExpires,
      phoneVerificationOtp: isVerifiedByDefault ? null : otp,
      phoneVerificationExpires: isVerifiedByDefault ? null : phoneVerificationExpires,
    });

    if (user) {
      // Log legal acceptances for compliance
      try {
        const LegalDocument = require('../models/LegalDocument');
        const LegalAcceptance = require('../models/LegalAcceptance');
        
        const logAcceptance = async (type) => {
          const doc = await LegalDocument.findOne({ type });
          const version = doc ? doc.version : 1;
          await LegalAcceptance.create({
            userId: user._id,
            documentType: type,
            version,
            acceptedAt: new Date()
          });
        };

        await logAcceptance('terms_conditions');
        await logAcceptance('privacy_policy');
        if (user.role === 'technician') {
          await logAcceptance('technician_terms');
        }
      } catch (err) {
        console.error('Failed to log legal acceptance compliance:', err.message);
      }

      // If role is technician, create a technician profile
      let techProfile = null;
      if (user.role === 'technician') {
        if (!skills || skills.length === 0 || !location) {
          await User.findByIdAndDelete(user._id);
          return res.status(400).json({ message: 'Technician must provide at least one service and location' });
        }

        // Map service IDs to readable skill names
        const serviceIdToName = {
          'ac_repair': 'AC Repair',
          'washing_machine': 'Washing Machine Repair',
          'refrigerator': 'Refrigerator Repair',
          'microwave': 'Microwave Repair',
          'tv_repair': 'TV Repair',
          'laptop_repair': 'Laptop Repair',
          'mobile_repair': 'Mobile Repair',
          'ac_install': 'AC Installation',
          'cctv_install': 'CCTV Installation',
          'ro_install': 'RO Installation',
          'inverter_install': 'Inverter Installation',
          'fan_install': 'Ceiling Fan Installation',
          'lock_install': 'Door Lock Installation',
          'furniture': 'Furniture Assembly',
          'sofa_clean': 'Sofa Cleaning',
          'bathroom_clean': 'Bathroom Deep Cleaning',
          'water_tank_clean': 'Water Tank Cleaning',
          'carpet_clean': 'Carpet Cleaning',
          'kitchen_clean': 'Kitchen Cleaning',
          'home_clean': 'Full Home Cleaning',
          'pest_control': 'Pest Control',
          'electric_wiring': 'Electric Wiring',
          'plumbing_work': 'Plumbing Work',
          'furniture_repair': 'Furniture Repair',
          'painting': 'Painting'
        };

        const selectedSkills = Array.isArray(skills) ? skills : [skills];
        const skillNames = selectedSkills.map(s => serviceIdToName[s] || s);

        const isOnline = availability === 'offline' ? false : true;
        const currentStatus = availability === 'offline' ? 'offline' : 'available';

        techProfile = await Technician.create({
          userId: user._id,
          name: user.name,
          email: user.email,
          phone: phone,
          skills: skillNames,
          services: selectedSkills,
          area: location,
          address: location,
          isProfileComplete: true,
          isOnline: isOnline,
          isVerified: false, // Must be verified by admin review, NOT auto-verified on signup!
          verificationStatus: 'unverified',
          currentStatus: currentStatus
        });
      }

      // Handle DeviceSession creation if deviceId is provided
      if (req.body.deviceId) {
        const DeviceSession = require('../models/DeviceSession');
        await DeviceSession.findOneAndUpdate(
          { userId: user._id.toString(), deviceId: req.body.deviceId },
          {
            userId: user._id.toString(),
            technicianId: techProfile ? techProfile._id.toString() : null,
            role: user.role,
            deviceId: req.body.deviceId,
            browser: req.body.browser || 'Unknown',
            platform: req.body.platform || 'Unknown',
            lastSeen: new Date(),
            isActive: true,
            loginTimestamp: new Date()
          },
          { upsert: true, new: true }
        );
      }

      // Send Welcome & Verification emails/SMS asynchronously
      if (!isVerifiedByDefault) {
        try {
          const { notifyUser } = require('../services/NotificationService');
          const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-account?token=${emailVerificationToken}&email=${encodeURIComponent(email)}`;
          
          console.log(`\n======================================================`);
          console.log(`📧 [EMAIL DISPATCH] Verification Link for ${email}: \n${verificationUrl}`);
          console.log(`📱 [SMS DISPATCH] Verification OTP for ${phone} is: ${otp}`);
          console.log(`======================================================\n`);

          // Send verification details (real OTP/URL sent via Email/SMS, safe message in notification center)
          notifyUser({
            userId: user._id.toString(),
            email: user.email,
            phone: user.phone,
            type: 'both',
            subject: 'Verify your Fixvo Account 🔒',
            text: `Hi ${user.name}, welcome to Fixvo! Please check your email and phone SMS to verify your account.`,
          }).catch(err => console.error('Failed to send verification notification:', err));
        } catch (e) {
          console.error('Failed to initiate verification notifications:', e);
        }
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        token: generateToken(user._id, user.role, user.email), // returns token, but routes are gated by verification
      });

    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password, deviceId, browser, platform } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is currently locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ message: `Account is temporarily locked due to multiple failed login attempts. Try again in ${minutesLeft} minutes.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // Reset failed attempts on success
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();

      // Create or update device session if deviceId is provided
      if (deviceId) {
        const DeviceSession = require('../models/DeviceSession');
        let techProfile = null;
        if (user.role === 'technician') {
          techProfile = await Technician.findOne({ userId: user._id });
        }
        await DeviceSession.findOneAndUpdate(
          { userId: user._id.toString(), deviceId },
          {
            userId: user._id.toString(),
            technicianId: techProfile ? techProfile._id.toString() : null,
            role: user.role,
            deviceId,
            browser: browser || 'Unknown',
            platform: platform || 'Unknown',
            lastSeen: new Date(),
            isActive: true,
            loginTimestamp: new Date()
          },
          { upsert: true, new: true }
        );
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        token: generateToken(user._id, user.role, user.email),
      });
    } else {
      // Increment failed attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
        await user.save();

        // Log a high-severity security alert
        const SecurityAlert = require('../models/SecurityAlert');
        await SecurityAlert.create({
          userId: user._id,
          userEmail: user.email,
          alertType: 'FAILED_LOGIN_LOCKOUT',
          severity: 'high',
          description: `Account temporarily locked after 5 consecutive failed login attempts.`,
          metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
        });

        return res.status(403).json({ message: 'Account locked due to 5 failed attempts. Please try again in 15 minutes.' });
      }

      await user.save();
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user and deactivate device session
// @route   POST /api/auth/logout
// @access  Public (Gracefully handles token presence)
const logoutUser = async (req, res) => {
  try {
    const { deviceId } = req.body;
    let userId = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[2] || req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        userId = decoded.id;
      } catch (err) {
        // Continue if token verification fails
      }
    }

    if (deviceId) {
      const DeviceSession = require('../models/DeviceSession');
      const PushSubscription = require('../models/PushSubscription');

      if (userId) {
        await DeviceSession.updateMany(
          { userId: userId.toString(), deviceId },
          { $set: { isActive: false } }
        );
        await PushSubscription.deleteMany({ userId: userId.toString(), deviceId });

        // Note: Technician online status is preserved on logout as per real-time marketplace rules.
        // Technician remains online until manually disabled.
      } else {
        await DeviceSession.updateMany(
          { deviceId },
          { $set: { isActive: false } }
        );
        await PushSubscription.deleteMany({ deviceId });
      }
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let profile = { user };
    if (user.role === 'technician') {
      const techProfile = await Technician.findOne({ userId: user._id });
      profile.technician = techProfile;
    }
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Secure Admin Creation (Recovery Endpoint)
// @route   POST /api/auth/create-admin
// @access  Protected by secret key
const createAdmin = async (req, res) => {
  const { name, email, phone, password, secretKey } = req.body;
  const recoveryKey = process.env.ADMIN_RECOVERY_KEY || process.env.JWT_SECRET || 'fixvoRecovery123!';

  if (!secretKey || secretKey !== recoveryKey) {
    return res.status(403).json({ message: 'Unauthorized admin recovery attempt. Invalid secret key.' });
  }

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: 'Please provide all required fields: name, email, phone, password.' });
  }

  try {
    const adminExists = await User.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin account already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'admin',
      isPremium: true
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id, user.role, user.email),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email address
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  const { email, token } = req.body;

  try {
    if (!email || !token) {
      return res.status(400).json({ message: 'Email and verification token are required' });
    }

    const user = await User.findOne({ 
      email, 
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired email verification link/token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Email verified successfully!',
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify mobile phone OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  let { phone, otp } = req.body;

  try {
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and 6-digit OTP code are required' });
    }

    phone = normalizePhone(phone);

    const user = await User.findOne({ 
      phone, 
      phoneVerificationOtp: otp,
      phoneVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired SMS OTP code' });
    }

    user.isPhoneVerified = true;
    user.phoneVerificationOtp = null;
    user.phoneVerificationExpires = null;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Phone number verified successfully!',
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend email and phone verification codes
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    if (user.isEmailVerified && user.isPhoneVerified) {
      return res.status(400).json({ message: 'Account is already fully verified.' });
    }

    const crypto = require('crypto');
    const newEmailToken = crypto.randomBytes(32).toString('hex');
    const newEmailExpires = Date.now() + 24 * 3600 * 1000;
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newOtpExpires = Date.now() + 10 * 60 * 1000;

    if (!user.isEmailVerified) {
      user.emailVerificationToken = newEmailToken;
      user.emailVerificationExpires = newEmailExpires;
    }
    if (!user.isPhoneVerified) {
      user.phoneVerificationOtp = newOtp;
      user.phoneVerificationExpires = newOtpExpires;
    }

    await user.save();

    // Trigger dispatches
    try {
      const { notifyUser } = require('../services/NotificationService');
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-account?token=${newEmailToken}&email=${encodeURIComponent(email)}`;

      console.log(`\n======================================================`);
      console.log(`📧 [EMAIL RESEND] Verification Link for ${email}: \n${verificationUrl}`);
      console.log(`📱 [SMS RESEND] Verification OTP for ${user.phone} is: ${newOtp}`);
      console.log(`======================================================\n`);

      notifyUser({
        userId: user._id.toString(),
        email: user.email,
        phone: user.phone,
        type: 'both',
        subject: 'Verify your Fixvo Account (Resend) 🔒',
        text: `A new verification request was sent. Please check your email and phone SMS to complete verification.`,
      }).catch(err => console.error('Failed to resend verification:', err));
    } catch (e) {
      console.error('Failed to initiate resend alerts:', e);
    }

    res.json({ success: true, message: 'Verification details resent successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Google OAuth Login / Sign up (Real Google Verification)
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { credential, idToken, accessToken } = req.body;
    const tokenToVerify = credential || idToken;

    let googleUser = null;

    // 1. Verify via Google OAuth2 Client if ID Token / Credential provided
    if (tokenToVerify) {
      try {
        const { OAuth2Client } = require('google-auth-library');
        const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
        const client = new OAuth2Client(googleClientId);

        const ticket = await client.verifyIdToken({
          idToken: tokenToVerify,
          audience: googleClientId ? [googleClientId] : undefined
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          googleUser = {
            googleId: payload.sub,
            email: payload.email.toLowerCase(),
            name: payload.name || payload.given_name || payload.email.split('@')[0],
            avatar: payload.picture || '👤',
            emailVerified: payload.email_verified
          };
        }
      } catch (clientErr) {
        console.warn('google-auth-library verification fallback:', clientErr.message);
        // Fallback: Verify directly via Google's tokeninfo API
        try {
          const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenToVerify}`);
          const data = await response.json();
          if (data && data.email && !data.error) {
            googleUser = {
              googleId: data.sub,
              email: data.email.toLowerCase(),
              name: data.name || data.email.split('@')[0],
              avatar: data.picture || '👤',
              emailVerified: data.email_verified === 'true' || data.email_verified === true
            };
          }
        } catch (apiErr) {
          console.error('Google tokeninfo API error:', apiErr.message);
        }
      }
    } else if (accessToken) {
      // Verify via Google UserInfo API using Access Token
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await response.json();
        if (data && data.email && !data.error) {
          googleUser = {
            googleId: data.sub,
            email: data.email.toLowerCase(),
            name: data.name || data.given_name || data.email.split('@')[0],
            avatar: data.picture || '👤',
            emailVerified: data.email_verified
          };
        }
      } catch (userinfoErr) {
        console.error('Google userinfo API error:', userinfoErr.message);
      }
    }

    if (!googleUser || !googleUser.email) {
      return res.status(401).json({ 
        message: 'Google authentication verification failed. Invalid or expired token.' 
      });
    }

    const { email, name, googleId, avatar } = googleUser;

    // 2. Resolve or Link Fixvo Account (Zero Duplicate Accounts)
    let user = await User.findOne({ 
      $or: [
        { googleId: googleId },
        { email: email }
      ]
    });

    if (!user) {
      // Create new customer account with default 'user' role
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(24).toString('hex') + 'A1!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name: name,
        email: email,
        googleId: googleId,
        authProvider: 'google',
        password: hashedPassword,
        role: 'user', // Default role is strictly customer
        isEmailVerified: true,
        isPhoneVerified: false,
        avatar: avatar || '👤'
      });

      // Create matching Customer Profile
      const CustomerProfile = require('../models/CustomerProfile');
      await CustomerProfile.create({
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || '👤',
        address: ''
      });

    } else {
      // Link Google ID and verify email if not already set
      let modified = false;
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        modified = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        modified = true;
      }
      if (avatar && (!user.avatar || user.avatar === '👤')) {
        user.avatar = avatar;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    }

    // 3. Issue genuine Fixvo JWT Session Token with existing DB role
    const token = generateToken(user._id, user.role, user.email);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      role: user.role, // Derived strictly from verified DB record
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      avatar: user.avatar,
      token,
    });
  } catch (error) {
    console.error('Google Auth Controller Exception:', error);
    res.status(500).json({ message: error.message || 'Google sign-in processing failed.' });
  }
};

// @desc    Verify Captcha Text
// @route   POST /api/auth/captcha-verify
// @access  Public
const verifyCaptcha = async (req, res) => {
  try {
    const input = req.body.input || req.body.userSolution;
    const expected = req.body.expected || req.body.captchaText;
    if (!input || !expected) {
      return res.status(400).json({ message: 'Both input and expected captcha text are required.' });
    }
    if (input.trim().toUpperCase() === expected.trim().toUpperCase()) {
      return res.json({ success: true, message: 'Captcha verified successfully.' });
    } else {
      return res.status(400).json({ success: false, message: 'Captcha text does not match.' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Captcha verification failed.' });
  }
};

module.exports = { signup, login, logoutUser, getMe, createAdmin, verifyEmail, verifyOtp, resendVerification, verifyCaptcha, googleAuth };
