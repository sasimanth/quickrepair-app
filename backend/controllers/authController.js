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

const sendEmail = require('../utils/sendEmail');

const otpStore = new Map();

// @desc    Send OTP via Email
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60000 }); // Valid for 5 mins

    await sendEmail({
      to: email,
      subject: 'Verify your Fixvo Account',
      text: `Hi ${name || 'there'},\n\nYour 6-digit verification code is: ${otp}\n\nThis code is valid for 5 minutes.\n\nBest,\nFixvo Team`,
      html: `
        <div style="font-family: 'Inter', Helvetica, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: #4f46e5; padding: 30px; text-align: center;">
             <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Fixvo</h1>
          </div>
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <h2 style="color: #1e293b; margin-top: 0;">Verify your email address</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">Hi ${name || 'there'},</p>
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">Thank you for joining Fixvo! Please use the following 6-digit verification code to complete your registration. This code will expire in 5 minutes.</p>
            
            <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
               <h1 style="color: #4f46e5; letter-spacing: 8px; margin: 0; font-size: 36px;">${otp}</h1>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">If you didn't request this code, you can safely ignore this email.</p>
          </div>
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #eaeaea;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Fixvo Inc. All rights reserved.</p>
          </div>
        </div>
      `
    });

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP Send Error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  let { name, email, phone, password, role, skills, location, otp } = req.body;
  if (phone) phone = normalizePhone(phone);

  try {
    // Verify OTP
    const stored = otpStore.get(email);
    if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
       return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'user',
    });

    if (user) {
      // Clear OTP
      otpStore.delete(email);

      // If role is technician, create a technician profile
      if (user.role === 'technician') {
        if (!skills || !location) {
          await User.findByIdAndDelete(user._id);
          return res.status(400).json({ message: 'Technician must provide skills and location' });
        }
        // Map skill to corresponding service ID for better filtering
        const skillToService = {
          'AC Repair': 'ac_repair',
          'Electrical': 'electric_wiring',
          'Plumbing': 'plumbing_work',
          'Mobile Repair': 'mobile_repair',
          'CCTV Installation': 'cctv_install',
          'Cleaning': 'home_clean'
        };
        const selectedSkills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
        const mappedServices = selectedSkills.map(s => skillToService[s] || s);

        await Technician.create({
          userId: user._id,
          name: user.name,
          email: user.email,
          skills: selectedSkills,
          services: mappedServices,
          area: location, // Location dropdown goes to area field for accurate filtering
          address: location,
          isProfileComplete: true, // Auto-approve for MVP testing
          isOnline: true,
          isVerified: true
        });
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id, user.role, user.email),
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
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id, user.role, user.email),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
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

module.exports = { sendOtp, signup, login, getMe };
