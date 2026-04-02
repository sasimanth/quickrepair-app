const User = require('../models/User');
const Booking = require('../models/Booking');

const getDashboardStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const uniqueUsers = await Booking.distinct('userId');
    const uniqueTechnicians = await Booking.distinct('providerId');
    
    // providerId distinct will include null if there are unassigned bookings, so we filter it
    const activeTechniciansCount = uniqueTechnicians.filter(id => id !== null).length;

    res.json({
      totalUsers: uniqueUsers.length,
      totalTechnicians: activeTechniciansCount,
      totalBookings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers
};
