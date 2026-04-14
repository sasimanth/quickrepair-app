const CustomerProfile = require('../models/CustomerProfile');
const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    let profile = await CustomerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      const user = await User.findById(req.user.id);
      profile = await CustomerProfile.create({
        userId: req.user.id,
        name: user ? user.name : 'Unknown',
        email: user ? user.email : '',
        phone: user ? user.phone : '',
        address: ''
      });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    let profile = await CustomerProfile.findOne({ userId: req.user.id });
    
    if (profile) {
      Object.assign(profile, req.body);
      await profile.save();
    } else {
      const user = await User.findById(req.user.id);
      profile = await CustomerProfile.create({
        userId: req.user.id,
        name: user ? user.name : 'Unknown',
        email: user ? user.email : '',
        phone: user ? user.phone : '',
        ...req.body
      });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile };
