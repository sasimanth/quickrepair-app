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

    // Clean up any existing bookings first
    await Booking.deleteMany({});
    console.log('Cleared existing bookings.');

    // Find our sample user and technician
    const userDoc = await User.findOne({ role: 'user' });
    const techDoc = await User.findOne({ role: 'technician' });

    console.log('User:', userDoc ? userDoc.email : 'None');
    console.log('Technician:', techDoc ? techDoc.email : 'None');

    if (!userDoc || !techDoc) {
      console.error('Need both user and technician to create booking.');
      return;
    }

    // 1. Create a booking with valid ObjectIds
    const booking1 = new Booking({
      userId: userDoc._id.toString(),
      userEmail: userDoc.email,
      name: userDoc.name,
      phone: userDoc.phone,
      serviceName: 'AC Repair',
      providerId: techDoc._id.toString(),
      providerEmail: techDoc.email,
      providerPhone: techDoc.phone,
      status: 'assigned',
      date: new Date(),
      deviceType: 'AC',
      problemDescription: 'Not cooling',
      location: 'Downtown Plaza',
      timeSlot: 'ASAP'
    });

    await booking1.save();
    console.log('Created booking 1 (valid IDs)');

    // 2. Create a booking with invalid string providerId (starts with tech-)
    const booking2 = new Booking({
      userId: userDoc._id.toString(),
      userEmail: userDoc.email,
      name: userDoc.name,
      phone: userDoc.phone,
      serviceName: 'Washing Machine Repair',
      providerId: 'tech-123',
      providerEmail: 'tech123@fixvo.com',
      providerPhone: '9876543210',
      status: 'assigned',
      date: new Date(),
      deviceType: 'Washing Machine',
      problemDescription: 'Spin cycle not working',
      location: 'Downtown Plaza',
      timeSlot: 'ASAP'
    });

    await booking2.save();
    console.log('Created booking 2 (providerId starts with tech-)');

    const count = await Booking.countDocuments({});
    console.log('Total bookings in DB now:', count);

  } catch (error) {
    console.error('Error in script:', error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
