const rateLimitStore = new Map(); // key -> array of request timestamps

const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000, // Default 1 minute
    max = 30, // Max requests allowed inside windowMs
    message = 'Too many requests from this client. Please try again later.',
    alertType = 'RATE_LIMIT_VIOLATION'
  } = options;

  return async (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown-ip';
    const userId = req.user ? (req.user.id || req.user._id || 'guest') : 'guest';
    const route = req.originalUrl || req.url;
    
    // Combine IP + User ID + Route to keep limits granular
    const key = `${route}_${ip}_${userId}`;
    const now = Date.now();

    // Clean up memory store periodically
    if (rateLimitStore.size > 5000) {
      const expirationThreshold = now - 60 * 60 * 1000; // Remove keys older than 1 hr
      for (const [k, v] of rateLimitStore.entries()) {
        const freshTimestamps = v.filter(time => time > expirationThreshold);
        if (freshTimestamps.length === 0) {
          rateLimitStore.delete(k);
        } else {
          rateLimitStore.set(k, freshTimestamps);
        }
      }
    }

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, [now]);
      return next();
    }

    let timestamps = rateLimitStore.get(key);
    timestamps = timestamps.filter(time => now - time < windowMs);

    if (timestamps.length >= max) {
      // Trigger a Security Alert on consecutive abuses
      try {
        const SecurityAlert = require('../models/SecurityAlert');
        
        // Ensure we don't spam the alert database for the same key within a short duration
        const lastAlertKey = `alert_logged_${key}`;
        if (!rateLimitStore.has(lastAlertKey) || now - rateLimitStore.get(lastAlertKey)[0] > 60 * 1000) {
          rateLimitStore.set(lastAlertKey, [now]);
          
          await SecurityAlert.create({
            userId: req.user ? req.user._id : null,
            userEmail: req.user ? req.user.email : 'anonymous',
            alertType,
            severity: 'medium',
            description: `Rate limit violation on route: ${route}. Attempted requests: ${timestamps.length + 1} (Limit: ${max} within ${windowMs / 1000}s)`,
            metadata: { ipAddress: ip, route, userAgent: req.headers['user-agent'] }
          });
        }
      } catch (err) {
        console.error('Failed to log rate limit security alert:', err.message);
      }

      return res.status(429).json({ message });
    }

    timestamps.push(now);
    rateLimitStore.set(key, timestamps);
    next();
  };
};

module.exports = {
  createRateLimiter,
  loginLimiter: createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5,
    message: 'Too many login attempts. Please try again after 5 minutes.',
    alertType: 'RATE_LIMIT_VIOLATION'
  }),
  signupLimiter: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many signups from this location. You can create up to 3 accounts per hour.',
    alertType: 'RATE_LIMIT_VIOLATION'
  }),
  otpLimiter: createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3,
    message: 'OTP request rate limit exceeded. You can request up to 3 verification codes every 10 minutes.',
    alertType: 'RATE_LIMIT_VIOLATION'
  }),
  bookingLimiter: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Booking creation rate limit exceeded. You can book up to 5 repairs per hour.',
    alertType: 'RATE_LIMIT_VIOLATION'
  }),
  chatLimiter: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: 'Message rate limit exceeded. Please wait a moment before sending more messages.',
    alertType: 'RATE_LIMIT_VIOLATION'
  })
};
