const PayoutLog = require('../models/PayoutLog');

// @desc    Get payout logs for admin or technician
// @route   GET /api/payouts
const getPayoutLogs = async (req, res) => {
  try {
    let query = {};
    
    // Technicians can only see their own payout logs
    if (req.user.role === 'technician') {
      query.technicianId = req.user.id;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view payout ledgers' });
    }

    const logs = await PayoutLog.find(query)
      .populate({
        path: 'bookingId',
        select: 'serviceName customerName date paymentStatus amount status'
      })
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPayoutLogs };
