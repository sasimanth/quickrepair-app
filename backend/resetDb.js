const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
dns.setServers(['8.8.8.8']);
dotenv.config();

const User = require('./models/User');
const Booking = require('./models/Booking');
const Technician = require('./models/Technician');
const Review = require('./models/Review');
const QuickBooking = require('./models/QuickBooking');
const RepairRequest = require('./models/RepairRequest');
const Message = require('./models/Message');

const reset = async () => {
  try {
    console.log('Connecting to DB...', process.env.MONGODB_URI.split('@')[1]);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Delete all users except admin
    const result = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`Deleted ${result.deletedCount} non-admin users`);

    const bRes = await Booking.deleteMany({});
    console.log(`Deleted ${bRes.deletedCount} bookings`);

    const tRes = await Technician.deleteMany({});
    console.log(`Deleted ${tRes.deletedCount} technicians`);

    const rRes = await Review.deleteMany({});
    console.log(`Deleted ${rRes.deletedCount} reviews`);

    const qRes = await QuickBooking.deleteMany({});
    console.log(`Deleted ${qRes.deletedCount} quick bookings`);
    
    await RepairRequest.deleteMany({});
    await Message.deleteMany({});

    console.log('Database reset successfully.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

reset();
