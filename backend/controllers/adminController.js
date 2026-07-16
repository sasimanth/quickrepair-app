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

    const { calculateTechnicianWallet } = require('./technicianController');

    if (status === 'paid') {
      // Validate wallet balance (checking the real available balance before this request's pending deduction)
      const realAvailable = (tech.walletBalance || 0) + payoutReq.amount;
      if (realAvailable < payoutReq.amount) {
        return res.status(400).json({ message: 'Technician has insufficient wallet balance to complete this payout.' });
      }

      payoutReq.status = 'paid';
      payoutReq.transactionId = transactionId || `TXN_${Date.now()}`;
      payoutReq.adminNotes = adminNotes || 'Payout completed successfully';
      payoutReq.processedAt = new Date();
      await payoutReq.save();

      // Recalculate dynamic wallet stats to sync
      const walletStats = await calculateTechnicianWallet(payoutReq.technicianId);
      tech.walletBalance = walletStats.availableBalance;
      tech.totalEarnings = walletStats.netEarnings;
      tech.withdrawnAmount = walletStats.withdrawn;
      tech.pendingWithdrawal = walletStats.pendingWithdrawal;
      await tech.save();

      // Trigger user/notification alerts for the technician using notifyUser
      try {
        const { notifyUser } = require('../services/NotificationService');
        await notifyUser({
          userId: payoutReq.technicianId,
          email: tech.email,
          phone: tech.phone,
          type: 'both',
          subject: 'Payout Disbursed 💰',
          text: `Your withdrawal of ₹${payoutReq.amount} has been processed and paid! Transaction ID: ${payoutReq.transactionId}`,
          notifType: 'system',
          templateName: 'technicianWithdrawalProcessed',
          templateData: {
            name: tech.name,
            amount: payoutReq.amount,
            referenceNo: payoutReq.transactionId,
            url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/technician-dashboard`
          }
        });
      } catch (err) {
        console.error("Failed to dispatch payout notification", err);
      }

    } else if (status === 'rejected') {
      payoutReq.status = 'rejected';
      payoutReq.adminNotes = adminNotes || 'Payout request rejected by admin';
      payoutReq.processedAt = new Date();
      await payoutReq.save();

      // Recalculate dynamic wallet stats to sync (this automatically refunds/adds payoutReq.amount back to tech.walletBalance since it's no longer pending or paid)
      const walletStats = await calculateTechnicianWallet(payoutReq.technicianId);
      tech.walletBalance = walletStats.availableBalance;
      tech.totalEarnings = walletStats.netEarnings;
      tech.withdrawnAmount = walletStats.withdrawn;
      tech.pendingWithdrawal = walletStats.pendingWithdrawal;
      await tech.save();

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

      // Recalculate dynamic wallet stats to sync (approved keeps it as pending/approved in calculations)
      const walletStats = await calculateTechnicianWallet(payoutReq.technicianId);
      tech.walletBalance = walletStats.availableBalance;
      tech.totalEarnings = walletStats.netEarnings;
      tech.withdrawnAmount = walletStats.withdrawn;
      tech.pendingWithdrawal = walletStats.pendingWithdrawal;
      await tech.save();
    } else {
      return res.status(400).json({ message: 'Invalid status provided.' });
    }

    res.json({ message: `Withdrawal request status updated to ${status}`, payoutReq });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get technicians pending document verification
// @route   GET /api/admin/technicians/pending
// @access  Private (Admin Only)
const getPendingVerifications = async (req, res) => {
  try {
    const pendingTechs = await Technician.find({
      verificationStatus: { $in: ['pending', 'under_review', 'rejected'] }
    }).sort({ updatedAt: -1 });

    res.json(pendingTechs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve/Reject technician verification request
// @route   PUT /api/admin/technicians/:id/verify
// @access  Private (Admin Only)
const reviewTechnician = async (req, res) => {
  const { status, adminNotes } = req.body; // 'approved', 'rejected', 'under_review'
  
  if (!['approved', 'rejected', 'under_review'].includes(status)) {
    return res.status(400).json({ message: 'Invalid verification status code.' });
  }

  try {
    const tech = await Technician.findOne({ userId: req.params.id });
    if (!tech) {
      return res.status(404).json({ message: 'Technician profile not found.' });
    }

    const previousStatus = tech.verificationStatus;
    tech.verificationStatus = status;
    tech.isVerified = (status === 'approved');
    tech.backgroundCheckStatus = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending';
    await tech.save();

    // Update verified status in corresponding User document
    await User.findByIdAndUpdate(req.params.id, { isVerified: tech.isVerified });

    // Create Admin Audit Log
    const AdminAuditLog = require('../models/AdminAuditLog');
    await AdminAuditLog.create({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: status === 'approved' ? 'APPROVE_TECHNICIAN' : status === 'rejected' ? 'REJECT_TECHNICIAN' : 'REVIEW_TECHNICIAN_UNDER_WAY',
      targetId: req.params.id,
      targetType: 'Technician',
      details: { 
        techName: tech.name, 
        techEmail: tech.email,
        previousStatus,
        newStatus: status,
        adminNotes: adminNotes || 'N/A'
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Notify the technician
    try {
      const { notifyUser } = require('../services/NotificationService');
      if (status === 'approved') {
        await notifyUser({
          userId: tech.userId,
          email: tech.email,
          phone: tech.phone,
          type: 'both',
          subject: 'Fixvo Profile Approved! 🎉',
          text: 'Congratulations! Your Fixvo Professional Profile has been verified and approved. You can now receive local jobs.',
          templateName: 'technicianProfileApproved',
          templateData: {
            name: tech.name,
            url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/technician-dashboard`
          }
        });
      } else if (status === 'rejected') {
        const Notification = require('../models/Notification');
        await Notification.create({
          userId: tech.userId,
          title: 'Verification Request Rejected ❌',
          message: `Your professional profile verification was rejected. Reason: ${adminNotes || 'Prohibited/incomplete documents.'}`,
          type: 'system'
        });

        if (global.io) {
          global.io.to(`user_${tech.userId}`).emit('new_notification', {
            title: 'Verification Request Rejected ❌',
            message: `Your professional profile verification was rejected. Reason: ${adminNotes || 'Prohibited/incomplete documents.'}`
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to notify tech on verification change:', notifErr.message);
    }

    res.json({ message: `Technician verification status updated to ${status}`, tech });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getWithdrawals,
  updateWithdrawalStatus,
  getPendingVerifications,
  reviewTechnician
};
