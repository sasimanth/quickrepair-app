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
  let { name, email, phone, password, role, skills, location } = req.body;
  if (phone) phone = normalizePhone(phone);

  try {
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
      // If role is technician, create a technician profile
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

        await Technician.create({
          userId: user._id,
          name: user.name,
          email: user.email,
          phone: phone,
          skills: skillNames,
          services: selectedSkills,
          area: location,
          address: location,
          isProfileComplete: true,
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

module.exports = { signup, login, getMe };
