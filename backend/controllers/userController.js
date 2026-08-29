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
    const { name, phone, address, avatar, email } = req.body;

    let profile = await CustomerProfile.findOne({ userId: req.user.id });
    
    if (profile) {
      Object.assign(profile, req.body);
      await profile.save();
    } else {
      const user = await User.findById(req.user.id);
      profile = await CustomerProfile.create({
        userId: req.user.id,
        name: name || (user ? user.name : 'Unknown'),
        email: email || (user ? user.email : ''),
        phone: phone || (user ? user.phone : ''),
        avatar: avatar || '👤',
        address: address || '',
        ...req.body
      });
    }

    // Simultaneously update User model so login/auth sessions reflect updated name/phone/avatar
    const user = await User.findById(req.user.id);
    if (user) {
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (avatar) user.avatar = avatar;
      await user.save();
    }

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

// @desc    Convert reward points to Fixvo Cash (10 Points = ₹1 Fixvo Cash)
// @route   POST /api/users/convert-points
const convertPoints = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const pointsToConvert = Number(req.body.points) || user.rewardPoints || 0;
    if (pointsToConvert <= 0) {
      return res.status(400).json({ message: 'No reward points available to convert.' });
    }

    if (pointsToConvert > (user.rewardPoints || 0)) {
      return res.status(400).json({ message: `Cannot convert more than available ${user.rewardPoints} points.` });
    }

    // Minimum 10 points to convert
    if (pointsToConvert < 10) {
      return res.status(400).json({ message: 'Minimum 10 points required to convert to Fixvo Cash.' });
    }

    // 10 points = 1 INR
    const cashValue = Math.floor(pointsToConvert / 10);
    const convertedPoints = cashValue * 10;

    user.rewardPoints = (user.rewardPoints || 0) - convertedPoints;
    user.walletBalance = (user.walletBalance || 0) + cashValue;
    await user.save();

    res.json({
      success: true,
      message: `Successfully converted ${convertedPoints} points to ₹${cashValue} Fixvo Cash!`,
      walletBalance: user.walletBalance,
      rewardPoints: user.rewardPoints,
      convertedCash: cashValue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current wallet balance and reward points
// @route   GET /api/users/wallet-balance
const getWalletStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      walletBalance: user.walletBalance || 0,
      rewardPoints: user.rewardPoints || 0,
      isPremium: user.isPremium || false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile, upgradePremium, convertPoints, getWalletStats };
