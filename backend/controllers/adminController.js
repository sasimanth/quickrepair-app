const User = require('../models/User');
const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const Review = require('../models/Review');
const WithdrawalRequest = require('../models/WithdrawalRequest');

const getDashboardStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    
    // User counts
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalTechnicians = await User.countDocuments({ role: 'technician' });
    const premiumUsersCount = await User.countDocuments({ isPremium: true });

    // Active/Online technicians
    const onlineTechnicians = await Technician.countDocuments({ isOnline: true });

    // Bookings breakdowns
    const dailyBookings = await Booking.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const monthlyBookings = await Booking.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const cancellations = await Booking.countDocuments({ status: 'cancelled' });
    const completedBookingsCount = await Booking.countDocuments({ status: 'completed' });
    const cancellationRate = totalBookings > 0 ? ((cancellations / totalBookings) * 100).toFixed(1) : 0;

    // Premium Subscription Revenue estimation
    const premiumUsers = await User.find({ isPremium: true });
    let premiumRevenue = 0;
    premiumUsers.forEach(u => {
      if (u.membershipType === 'monthly') {
        premiumRevenue += 299;
      } else if (u.membershipType === 'yearly') {
        premiumRevenue += 1999;
      } else {
        premiumRevenue += 299; // fallback
      }
    });

    // Service Revenue estimation (platform fee of completed bookings)
    const completedBookings = await Booking.find({ status: 'completed' });
    let serviceRevenue = 0;
    completedBookings.forEach(b => {
      if (typeof b.platformCommission === 'number') {
        serviceRevenue += b.platformCommission;
      } else {
        const amt = b.amount || b.finalQuote || b.serviceCharge || 0;
        serviceRevenue += amt * 0.10; // 10% platform share fallback
      }
    });
    
    const totalPlatformRevenue = premiumRevenue + serviceRevenue;

    // Average rating
    const avgReview = await Review.aggregate([
      { $group: { _id: null, rating: { $avg: "$rating" } } }
    ]);
    const satisfactionRating = avgReview.length > 0 ? avgReview[0].rating.toFixed(1) : 4.8;

    // Service Demands (group by serviceName)
    const serviceDemandsRaw = await Booking.aggregate([
      { $group: { _id: "$serviceName", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const serviceDemands = serviceDemandsRaw.map(item => ({
      name: item._id || 'General',
      count: item.count
    }));

    // Area Demands (group by location/area)
    const areaDemandsRaw = await Booking.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Normalize area list: aggregate common prefix like "Galiveedu" or "Rayachoty"
    const areaMap = {};
    areaDemandsRaw.forEach(item => {
      let loc = item._id || 'Unknown';
      let norm = 'Other';
      if (loc.toLowerCase().includes('galiveedu')) norm = 'Galiveedu';
      else if (loc.toLowerCase().includes('rayachoty')) norm = 'Rayachoty';
      else if (loc.toLowerCase().includes('lakkireddipalli')) norm = 'Lakkireddipalli';
      else if (loc.toLowerCase().includes('kadapa')) norm = 'Kadapa';
      else {
        norm = loc.split(',')[0].trim();
      }
      areaMap[norm] = (areaMap[norm] || 0) + item.count;
    });

    const areaDemands = Object.keys(areaMap).map(key => ({
      name: key,
      count: areaMap[key]
    })).sort((a, b) => b.count - a.count);

    // Top Technicians
    const topTechs = await Technician.find({ isProfileComplete: true })
      .sort({ rating: -1, jobsCompleted: -1 })
      .limit(5);

    res.json({
      totalUsers,
      totalTechnicians,
      premiumUsersCount,
      onlineTechnicians,
      totalBookings,
      dailyBookings,
      monthlyBookings,
      cancellations,
      completedBookingsCount,
      cancellationRate,
      premiumRevenue,
      serviceRevenue,
      totalPlatformRevenue,
      satisfactionRating: parseFloat(satisfactionRating),
      serviceDemands,
      areaDemands,
      topTechnicians: topTechs.map(t => ({
        userId: t.userId,
        name: t.name,
        rating: t.rating,
        jobsCompleted: t.jobsCompleted,
        area: t.area,
        avatar: t.avatar
      }))
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

// Withdrawal/Payout Management
const getWithdrawals = async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find().sort({ createdAt: -1 });
    const populatedRequests = [];
    for (const reqObj of requests) {
      const tech = await Technician.findOne({ userId: reqObj.technicianId });
      const userObj = await User.findById(reqObj.technicianId).select('-password');
      populatedRequests.push({
        ...reqObj.toObject(),
        technician: tech ? tech.toObject() : (userObj ? { name: userObj.name, email: userObj.email, phone: userObj.phone, walletBalance: userObj.walletBalance } : null)
      });
    }
    res.json(populatedRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateWithdrawalStatus = async (req, res) => {
  const { status, adminNotes, transactionId } = req.body;
  try {
    const payoutReq = await WithdrawalRequest.findById(req.params.id);
    if (!payoutReq) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    const allowedTransitions = (
      (payoutReq.status === 'pending' && ['approved', 'paid', 'rejected'].includes(status)) ||
      (payoutReq.status === 'approved' && ['paid', 'rejected'].includes(status))
    );
    if (!allowedTransitions) {
      return res.status(400).json({ message: `Cannot update withdrawal request from status '${payoutReq.status}' to '${status}'` });
    }

    const tech = await Technician.findOne({ userId: payoutReq.technicianId });
    if (!tech) {
      return res.status(404).json({ message: 'Technician profile not found for this request' });
    }

    if (status === 'paid') {
      // Validate wallet balance
      if (tech.walletBalance < payoutReq.amount) {
        return res.status(400).json({ message: 'Technician has insufficient wallet balance to complete this payout.' });
      }

      // Deduct balance and pending withdrawal, add to withdrawnAmount
      tech.walletBalance -= payoutReq.amount;
      tech.pendingWithdrawal = Math.max(0, (tech.pendingWithdrawal || 0) - payoutReq.amount);
      tech.withdrawnAmount = (tech.withdrawnAmount || 0) + payoutReq.amount;
      await tech.save();

      payoutReq.status = 'paid';
      payoutReq.transactionId = transactionId || `TXN_${Date.now()}`;
      payoutReq.adminNotes = adminNotes || 'Payout completed successfully';
      payoutReq.processedAt = new Date();
      await payoutReq.save();

      // Trigger user/notification alerts for the technician
      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          userId: payoutReq.technicianId,
          title: 'Payout Disbursed 💰',
          message: `Your withdrawal of ₹${payoutReq.amount} has been processed and paid! Transaction ID: ${payoutReq.transactionId}`,
          type: 'payout'
        });
      } catch (err) {
        console.error("Failed to create payout notification", err);
      }

    } else if (status === 'rejected') {
      // Refund pending withdrawal count
      tech.pendingWithdrawal = Math.max(0, (tech.pendingWithdrawal || 0) - payoutReq.amount);
      await tech.save();

      payoutReq.status = 'rejected';
      payoutReq.adminNotes = adminNotes || 'Payout request rejected by admin';
      payoutReq.processedAt = new Date();
      await payoutReq.save();

      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          userId: payoutReq.technicianId,
          title: 'Payout Request Rejected ❌',
          message: `Your withdrawal request for ₹${payoutReq.amount} was rejected. Notes: ${payoutReq.adminNotes}`,
          type: 'payout'
        });
      } catch (err) {
        console.error("Failed to create payout rejection notification", err);
      }
    } else if (status === 'approved') {
      payoutReq.status = 'approved';
      payoutReq.adminNotes = adminNotes || 'Payout request approved by admin';
      payoutReq.processedAt = new Date();
      await payoutReq.save();
    } else {
      return res.status(400).json({ message: 'Invalid status provided.' });
    }

    res.json({ message: `Withdrawal request status updated to ${status}`, payoutReq });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getWithdrawals,
  updateWithdrawalStatus
};
