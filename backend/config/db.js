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

    // Atlas connections require strict stability checks for AWS/GCP drops
    const conn = await mongoose.connect(uri || 'mongodb://127.0.0.1:27017/fixvo', {
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
      socketTimeoutMS: 45000,          // Close sockets after 45 seconds of inactivity
    });

    console.log(`✅ MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
    
  } catch (error) {
    console.error(`❌ MongoDB Atlas Connection Error: ${error.message}`);
    // Do not terminate process so cloud web servers (Render/Railway) bind to PORT successfully
  }
};

module.exports = connectDB;
// trigger nodemon restart
