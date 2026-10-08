const express = require('express');
const Sentry = require('@sentry/node');
const requestId = require('./middleware/requestId'); const rawBody = require('./middleware/rawBody');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { scrubSentryEvent } = require('./utils/sentryHelper');

// Load env vars
dotenv.config();

// ─── Sentry Initialization ──────────────────────────────────────────────────
// Gated: disabled in test mode and when DSN is absent.
// tracesSampleRate is 5% in production — never 100% (would exhaust free tier).
Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  release: process.env.APP_VERSION || 'fixvo@0.0.0',
  enabled: !!process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.0,
  beforeSend: scrubSentryEvent,
  beforeSendTransaction: scrubSentryEvent
});

// Connect to database
if (!process.env.NODE_ENV || !process.env.NODE_ENV.includes('test')) {
  connectDB();
}

const app = express();
// Request ID for tracing logs
app.use(requestId);
// Sentry request handler must be first middleware
if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
  console.warn('RAZORPAY_WEBHOOK_SECRET is not set – Razorpay webhook verification will fail.');
}
app.use(Sentry.Handlers.requestHandler());
// ─── CORS configuration ───────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, cb) => {
    // Allow server-to-server, mobile app, or tools with no origin header
    if (!origin) return cb(null, true);

    // Allow all vercel deployment subdomains (*.vercel.app), render domains, localhost (HTTP & HTTPS for Capacitor Android), capacitor, ionic, and configured FRONTEND_URL
    const isVercel = /\.vercel\.app$/.test(origin);
    const isRender = /\.onrender\.com$/.test(origin);
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || 
                    origin.startsWith('capacitor://') || 
                    origin.startsWith('ionic://');
    const isExplicit = process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL;

    if (isVercel || isRender || isLocal || isExplicit || process.env.NODE_ENV !== 'production') {
      return cb(null, true);
    }

    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    return cb(new Error('CORS policy violation'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Accept'],
  credentials: true
};

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

global.io = io;
app.set('io', io);

app.use(cors(corsOptions));
// Apply rawBody middleware specifically for Razorpay webhook before JSON parsing
app.use('/api/payments/razorpay/webhook', rawBody);
// Apply rawWhatsAppBody specifically for Meta webhook before JSON parsing (mirrors Razorpay pattern)
const rawWhatsAppBody = require('./middleware/rawWhatsAppBody');
app.use('/api/whatsapp/webhook', rawWhatsAppBody);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ─── Security Headers ────────────────────────────────────────────────────────
// No helmet package — manually set critical security headers.
// In production these should be supplemented by Render's CDN/proxy headers.
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // HSTS: 1 year, enforces HTTPS (Render provides TLS termination)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  // Restrict resource loading to same-origin and known CDNs
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; connect-src 'self' https://*.sentry.io https://api.mixpanel.com; frame-src https://api.razorpay.com;"
  );
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin/security', require('./routes/securityRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/technicians', require('./routes/technicianRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/whatsapp', require('./routes/whatsappRoutes'));
app.use('/api/book-service', require('./routes/quickBookingRoutes'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/ai', require('./routes/aiAssistantRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/legal', require('./routes/legalRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));

app.get('/api/health', async (req, res) => {
  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const mongoState = mongoose.connection.readyState;
  const dbHealthy = mongoState === 1;
  const status = dbHealthy ? 'ok' : 'degraded';
  res.status(dbHealthy ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || 'unknown',
    db: dbHealthy ? 'connected' : `disconnected (state:${mongoState})`,
    uptime: Math.floor(process.uptime())
  });
});

// ─── Sentry Error Handler ──────────────────────────────────────────────────
// IMPORTANT: Must be placed AFTER all routes but BEFORE the custom error handler.
app.use(Sentry.Handlers.errorHandler());

// ─── Global Express Error Handler ────────────────────────────────────────────
// Catches any error passed via next(err) from controllers/middleware.
// Returns structured JSON with requestId for tracing.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const requestIdHeader = req.id || 'unknown';
  console.error(`[GlobalErrorHandler] ${status} ${req.method} ${req.originalUrl} — ${err.message} (requestId: ${requestIdHeader})`);
  
  // In production, sanitize 500 internal server errors to avoid exposing internal trace/schema details
  const clientMessage = (status >= 500 && process.env.NODE_ENV === 'production') 
    ? 'An internal server error occurred' 
    : (err.message || 'An unexpected error occurred');

  res.status(status).json({
    success: false,
    message: clientMessage,
    requestId: requestIdHeader
  });
});

const PORT = process.env.PORT || 5000;

// Only start the HTTP listener outside of test runs.
// Tests use supertest which attaches directly to the app/server object.
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 Fixvo backend listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

// Socket.io Real-time tracking logic
io.on('connection', (socket) => {
  console.log('⚡ Socket client connected:', socket.id);

  // Register any user (customer, technician, or admin) for private notifications/alerts
  socket.on('register_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} registered for private notifications`);
  });

  // Technician joins their own tracking room
  socket.on('register_tech', (techId) => {
    socket.join(`tech_${techId}`);
    console.log(`📡 Technician ${techId} registered for tracking`);
  });

  // Booking-scoped tracking subscription with ownership validation
  socket.on('join_booking_tracking', async (data) => {
    // data: { bookingId, userId }
    try {
      const Booking = require('./models/Booking');
      const bookingId = typeof data === 'string' ? data : data?.bookingId;
      const userId = typeof data === 'object' ? data?.userId : null;

      if (!bookingId) return;

      if (userId) {
        const booking = await Booking.findById(bookingId);
        if (booking) {
          const isCustomer = booking.userId && booking.userId.toString() === userId.toString();
          const isProvider = booking.providerId && booking.providerId.toString() === userId.toString();
          if (!isCustomer && !isProvider) {
            console.warn(`⚠️ Socket join_booking_tracking denied for user ${userId} on booking ${bookingId}`);
            return;
          }
        }
      }

      socket.join(`track_booking_${bookingId}`);
      console.log(`👁️ Subscribed to tracking room for booking: track_booking_${bookingId}`);
    } catch (err) {
      console.error('Error joining tracking room:', err.message);
    }
  });

  // Client subscribes to track a technician (legacy support)
  socket.on('track_tech', (techId) => {
    socket.join(`track_${techId}`);
    console.log(`👁️ Client tracking technician ${techId}`);
  });

  const Technician = require('./models/Technician');
  const Booking = require('./models/Booking');

  // Technician emits live location updates
  socket.on('update_booking_location', async (data) => {
    // data: { bookingId, techId, lat, lng, speed, heading }
    const { bookingId, techId, lat, lng, speed, heading } = data || {};
    if (!lat || !lng) return;

    try {
      let targetBookingId = bookingId;

      // If bookingId not supplied, try to find active job for technician
      if (!targetBookingId && techId) {
        const activeBooking = await Booking.findOne({
          providerId: techId,
          status: { $in: ['accepted', 'on_the_way'] }
        });
        if (activeBooking) targetBookingId = activeBooking._id.toString();
      }

      const updatePayload = {
        bookingId: targetBookingId,
        techId,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        speed: speed || 0,
        heading: heading || 0,
        timestamp: new Date().toISOString()
      };

      if (targetBookingId) {
        io.to(`track_booking_${targetBookingId}`).emit('location_update', updatePayload);
      }
      if (techId) {
        io.to(`track_${techId}`).emit('location_update', updatePayload);
      }

      // Persist latest coordinates
      if (targetBookingId) {
        await Booking.findByIdAndUpdate(targetBookingId, {
          lastTechLat: parseFloat(lat),
          lastTechLng: parseFloat(lng),
          lastTechLocationUpdate: new Date(),
          trackingActive: true
        });
      }

      if (techId) {
        await Technician.updateOne(
          { userId: techId },
          { 
            location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }
          }
        );
      }
    } catch (e) {
      console.error('Booking location update error:', e.message);
    }
  });

  // Continuous location update (legacy listener)
  socket.on('update_location', async (data) => {
    // data: { techId, lat, lng }
    if (!data || !data.lat || !data.lng) return;
    io.to(`track_${data.techId}`).emit('location_update', { lat: data.lat, lng: data.lng });
    
    try {
      await Technician.updateOne(
        { userId: data.techId },
        { 
           location: { type: 'Point', coordinates: [parseFloat(data.lng), parseFloat(data.lat)] }
        }
      );
    } catch (e) {
      console.error('Location update DB error:', e.message);
    }
  });

  // Chat logic
  socket.on('join_chat', (bookingId) => {
    socket.join(`chat_${bookingId}`);
    console.log(`💬 User joined chat room: chat_${bookingId}`);
  });

  socket.on('send_message', (data) => {
    // data: { bookingId, messageObj }
    io.to(`chat_${data.bookingId}`).emit('receive_message', data.messageObj);
  });

  socket.on('message_delivered', async (data) => {
    // data: { messageId, bookingId }
    try {
      const Message = require('./models/Message');
      await Message.findByIdAndUpdate(data.messageId, { isDelivered: true });
      io.to(`chat_${data.bookingId}`).emit('message_delivered', data);
    } catch (e) {
      console.error('Error marking message as delivered in socket:', e);
    }
  });

  socket.on('read_messages', async (data) => {
    // data: { bookingId, userId }
    try {
      const Message = require('./models/Message');
      await Message.updateMany(
        { bookingId: data.bookingId, senderId: { $ne: data.userId }, isRead: false },
        { isRead: true, isDelivered: true }
      );
      io.to(`chat_${data.bookingId}`).emit('messages_read', { bookingId: data.bookingId, readerId: data.userId });
    } catch (e) {
      console.error('Error marking messages as read in socket:', e);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

module.exports = { app, server };
