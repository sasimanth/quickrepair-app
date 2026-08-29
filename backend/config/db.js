const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Windows/ISP DNS bug: Force Google Public DNS for SRV lookups on Windows dev
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8']);
  } catch (e) {
    console.warn('DNS server override ignored:', e.message);
  }
}

// Robust MongoDB Atlas Connection File
const connectDB = async () => {
  try {
    // Looks for MONGODB_URI (which we put in .env.example) or MONGO_URI
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!uri || uri.includes("127.0.0.1")) {
      console.warn("⚠️ WARNING: No live Atlas URI found in .env! Connecting to local database instead.");
    }

    // Atlas connections require strict stability checks and pooling for AWS/GCP drops
    const conn = await mongoose.connect(uri || 'mongodb://127.0.0.1:27017/fixvo', {
      maxPoolSize: 20,                 // Up to 20 concurrent socket connections
      minPoolSize: 5,                  // Maintain 5 hot sockets for low latency
      serverSelectionTimeoutMS: 10000, // Keep trying to discover nodes for 10s
      socketTimeoutMS: 45000,          // Close inactive sockets after 45s
      heartbeatFrequencyMS: 10000,     // Node heartbeat health checks
    });

    console.log(`✅ MongoDB Atlas Connected Successfully: ${conn.connection.host}`);

    // Ensure essential indexes are synchronized safely across models
    try {
      const models = [
        require('../models/User'),
        require('../models/Technician'),
        require('../models/Booking'),
        require('../models/CustomerProfile'),
        require('../models/Review'),
        require('../models/Notification'),
        require('../models/Message'),
        require('../models/DeviceSession'),
        require('../models/PushSubscription'),
        require('../models/LegalDocument')
      ];
      await Promise.all(models.map(m => m.syncIndexes ? m.syncIndexes().catch(() => {}) : Promise.resolve()));
    } catch (syncErr) {
      console.warn('⚠️ Index sync notice:', syncErr.message);
    }
    
  } catch (error) {
    console.error(`❌ MongoDB Atlas Connection Error: ${error.message}`);
    // Do not terminate process so cloud web servers (Render/Railway) bind to PORT successfully
  }
};

module.exports = connectDB;
// trigger nodemon restart
