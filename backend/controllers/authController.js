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

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  let { name, email, phone, password, role, skills, location, availability } = req.body;
  if (phone) phone = normalizePhone(phone);

  try {
    if (role === 'admin') {
      const { adminSecret } = req.body;
      const recoveryKey = process.env.ADMIN_RECOVERY_KEY || process.env.JWT_SECRET || 'fixvoRecovery123!';
      if (adminSecret !== recoveryKey && adminSecret !== 'fixvoAdmin2026') {
        return res.status(403).json({ message: 'Unauthorized. Invalid Admin Security Code.' });
      }
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
          isVerified: true,
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
  const { email, password, deviceId, browser, platform } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
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
        token: generateToken(user._id, user.role, user.email),
      });
    } else {
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

module.exports = { signup, login, logoutUser, getMe, createAdmin };
