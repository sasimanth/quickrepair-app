const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
dns.setServers(['8.8.8.8']);

const Booking = require('./models/Booking');
const User = require('./models/User');

dotenv.config();

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fixvo';
    console.log('Connecting to database:', uri.replace(/:([^@]+)@/, ':***@'));
    await mongoose.connect(uri);
    console.log('Connected!');

    // Let's find some bookings
    const bookings = await Booking.find({}).limit(5);
    console.log('Bookings count in DB:', await Booking.countDocuments({}));
    console.log('Sample bookings:', JSON.stringify(bookings, null, 2));

    // Let's test getBookings logic for a user role
    // Let's find a regular user in the DB
    const sampleUser = await User.findOne({ role: 'user' });
    console.log('Sample user:', sampleUser);
    
    // Let's print all collections and their counts
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    for (let col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments({});
      console.log(`- ${col.name}: ${count} documents`);
    }

    // Let's find all users
    const users = await User.find({});
    console.log('All users in DB:', JSON.stringify(users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })), null, 2));

  } catch (error) {
    console.error('Error running test script:', error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
