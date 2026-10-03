// backend/utils/logger.js
// Winston structured JSON logger for Fixvo backend.
//
// Usage:
//   const logger = require('./utils/logger');
//   logger.error({ message: 'Payment failed', requestId: req.id, bookingId, err: error.message });
//   logger.warn({ message: 'Rate limit hit', route: req.path });
//   logger.info({ message: 'User signed up', role: 'user' });
//
// IMPORTANT: Never pass raw user objects, email, phone, passwords, or payment
// credentials as logger properties. Pass only safe scalar fields.

const winston = require('winston');

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

// ─── Log Level ────────────────────────────────────────────────────────────────
// Controlled via LOG_LEVEL env var. Defaults to 'info'.
// Order: error < warn < info < http < verbose < debug < silly
const level = process.env.LOG_LEVEL || 'info';

// ─── Transports ───────────────────────────────────────────────────────────────
const transports = [];

if (process.env.NODE_ENV === 'production') {
  // Production: structured JSON — suitable for Logtail / Papertrail / Render log drain
  transports.push(
    new winston.transports.Console({
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      )
    })
  );
} else if (process.env.NODE_ENV !== 'test') {
  // Development: human-readable colorised output
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        simple()
      )
    })
  );
}
// In 'test' mode: no transports → logs are silenced to keep test output clean.
// Individual test files can spy on logger methods if needed.

// ─── Logger Instance ──────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level,
  transports,
  // Prevent winston from exiting the process on uncaught exceptions in test mode
  exitOnError: false
});

module.exports = logger;
