const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Pass IO to requests explicitly (optional if we want cross-file emits later)
app.set('io', io);

app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/technicians', require('./routes/technicianRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/whatsapp', require('./routes/whatsappRoutes'));
app.use('/api/book-service', require('./routes/quickBookingRoutes'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/contact', require('./routes/contactRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fixvo API is running' });
});

const PORT = process.env.PORT || 5000;

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

  // Client subscribes to track a technician
  socket.on('track_tech', (techId) => {
    socket.join(`track_${techId}`);
    console.log(`👁️ Client tracking technician ${techId}`);
  });

  const Technician = require('./models/Technician');

  // Technician emits their location continuous update
  socket.on('update_location', async (data) => {
    // data: { techId, lat, lng }
    io.to(`track_${data.techId}`).emit('location_update', { lat: data.lat, lng: data.lng });
    
    try {
      await Technician.updateOne(
        { userId: data.techId },
        { 
           location: { type: 'Point', coordinates: [data.lng, data.lat] },
           // Depending on schema, we could store lastUpdated or timestamps handles it
        }
      );
    } catch (e) {
      console.log('Location update DB error', e);
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

  socket.on('read_messages', (data) => {
    // data: { bookingId, readerId }
    io.to(`chat_${data.bookingId}`).emit('read_messages', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server & WebSockets running on port ${PORT}`);
});
