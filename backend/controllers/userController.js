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
    
    // Fetch User to append premium membership status details
    const user = await User.findById(req.user.id);
    const mergedProfile = {
      ...profile.toObject(),
      isPremium: user ? user.isPremium : false,
      membershipType: user ? user.membershipType : 'none',
      membershipExpiry: user ? user.membershipExpiry : null,
      membershipActiveDate: user ? user.membershipActiveDate : null,
      premiumBenefits: user ? user.premiumBenefits : { inspectionsUsed: 0, totalSaved: 0 }
    };
    
    res.json(mergedProfile);
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

const upgradePremium = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isPremium = true;
    user.membershipType = req.body.plan === 'monthly' ? 'monthly' : 'yearly';
    
    // Set expiry based on plan
    const expiry = new Date();
    if (user.membershipType === 'monthly') {
      expiry.setMonth(expiry.getMonth() + 1);
    } else {
      expiry.setFullYear(expiry.getFullYear() + 1);
    }
    user.membershipExpiry = expiry;

    await user.save();

    res.json({ message: 'Successfully upgraded to premium', isPremium: user.isPremium, membershipType: user.membershipType, membershipExpiry: user.membershipExpiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile, upgradePremium };
