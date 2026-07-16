const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      
      const User = require('../models/User');
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Check if user is locked
      if (user.lockUntil && user.lockUntil > Date.now()) {
        const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
        return res.status(403).json({ message: `Account is temporarily locked. Try again in ${minutesLeft} minutes.` });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('JWT Verify Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      
      const User = require('../models/User');
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    } catch (error) {
      console.error('Optional JWT Verify Error:', error.message);
    }
  }
  return next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'User role not authorized' });
    }
    next();
  };
};

const ensureVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  // Admins are auto-verified
  if (req.user.role === 'admin') {
    return next();
  }
  if (!req.user.isEmailVerified || !req.user.isPhoneVerified) {
    return res.status(403).json({ 
      message: 'Account not fully verified. Email and Mobile OTP verification are required to perform this action.',
      isEmailVerified: req.user.isEmailVerified,
      isPhoneVerified: req.user.isPhoneVerified,
      requiresVerification: true
    });
  }
  next();
};

module.exports = { protect, authorize, optionalAuth, ensureVerified };
