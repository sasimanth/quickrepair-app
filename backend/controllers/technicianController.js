const Technician = require('../models/Technician');
const User = require('../models/User');
const QuickBooking = require('../models/QuickBooking');

// @desc    Get or create technician profile
// @route   GET /api/technicians/profile
const getProfile = async (req, res) => {
  try {
    let tech = await Technician.findOne({ userId: req.user.id });
    if (!tech) {
      const user = await User.findById(req.user.id);
      
      tech = await Technician.create({
        userId: req.user.id,
        name: user ? user.name : 'Unknown Tech',
        email: user ? user.email : '',
        rating: 4.8 + (Math.random() * 0.2), // Random initial good rating
      });
    }

    // Dynamic Pending Earnings Calculation (active jobs OR completed but unpaid jobs)
    const Booking = require('../models/Booking');
    const pendingJobs = await Booking.find({
      providerId: req.user.id,
      $or: [
        { status: { $in: ['accepted', 'on_the_way', 'arrived', 'quote_pending', 'quote_approved', 'in_progress'] } },
        { status: 'completed', paymentStatus: { $ne: 'completed' } }
      ]
    });
    
    const pendingEarnings = pendingJobs.reduce((sum, job) => {
      const gross = job.finalQuote || (job.serviceId?.price || 0);
      const discount = job.isPremiumUser ? (gross * 0.15) : 0;
      const net = (gross - discount) * 0.90;
      return sum + net;
    }, 0);

    // Fetch previous withdrawal request logs
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    const withdrawals = await WithdrawalRequest.find({ technicianId: req.user.id }).sort({ createdAt: -1 });

    // Fetch completed & PAID bookings to calculate gross, commission, net
    const completedPaidJobs = await Booking.find({
      providerId: req.user.id,
      status: 'completed',
      paymentStatus: 'completed'
    });

    let calculatedGross = 0;
    let calculatedCommission = 0;
    let calculatedNet = 0;
    let onlineNetEarnings = 0;
    let cashPlatformFee = 0;

    completedPaidJobs.forEach(job => {
      const gross = job.finalQuote || job.amount || 0;
      const discount = job.membershipDiscount || 0;
      const commission = typeof job.platformCommission === 'number' ? job.platformCommission : ((gross - discount) * 0.10);
      const net = typeof job.finalTechnicianEarning === 'number' ? job.finalTechnicianEarning : ((gross - discount) * 0.90);

      calculatedGross += gross;
      calculatedCommission += commission;
      calculatedNet += net;

      if (job.paymentMethod === 'cash') {
        cashPlatformFee += commission;
      } else {
        onlineNetEarnings += net;
      }
    });

    // Available Balance is online net earnings minus commission owed from cash jobs, minus withdrawals
    const availableBalance = Math.max(0, onlineNetEarnings - cashPlatformFee - (tech.withdrawnAmount || 0) - (tech.pendingWithdrawal || 0));

    // Persist correct wallet balance in DB
    tech.walletBalance = availableBalance;
    await tech.save();

    const techObj = tech.toObject();
    techObj.pendingEarnings = pendingEarnings;
    techObj.withdrawals = withdrawals;
    
    // Attach dynamically calculated statistics
    techObj.totalEarned = calculatedGross;
    techObj.platformCommission = calculatedCommission;
    techObj.netEarnings = calculatedNet;
    techObj.walletBalance = availableBalance;

    res.json(techObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update technician profile (Location, Skills, etc)
// @route   PUT /api/technicians/profile
const updateProfile = async (req, res) => {
  const { address, lat, lng, skills, experience, avatar, isOnline } = req.body;
  try {
    let tech = await Technician.findOne({ userId: req.user.id });
    
    // Convert array components if skills is string
    const skillsArray = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : tech?.skills);

    const updateFields = {
      address: address || tech?.address,
      skills: skillsArray,
      experience: experience || tech?.experience,
      avatar: avatar || tech?.avatar,
      isProfileComplete: true,
      ...(isOnline !== undefined && { isOnline })
    };

    if (lat && lng) {
      updateFields.location = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      };
    }

    if (tech) {
      Object.assign(tech, updateFields);
      await tech.save();
    } else {
      const user = await User.findById(req.user.id);
      tech = await Technician.create({
        userId: req.user.id,
        name: user ? user.name : 'Unknown Tech',
        email: user ? user.email : '',
        ...updateFields
      });
    }

    res.json(tech);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNearbyTechnicians = async (req, res) => {
  const { area, serviceId } = req.query;

  try {
    let query = {
      isProfileComplete: true,
      isOnline: true
    };

    if (area) {
      // Area match (case-insensitive)
      query.area = { $regex: new RegExp(`^${area}$`, 'i') };
    }

    if (serviceId) {
      query.services = serviceId;
    }

    let techs = await Technician.find(query).limit(30);
    
    techs.sort((a, b) => {
      return b.rating - a.rating;
    });

    const formattedTechs = techs.slice(0, 10).map((tech, i) => ({
      id: tech.userId,
      name: tech.name,
      rating: tech.rating.toFixed(1),
      experience: tech.experience,
      distance: tech.area || (area ? 'In your area' : 'Nearby'),
      jobsCompleted: tech.jobsCompleted,
      isVerified: tech.isVerified,
      avatar: tech.avatar,
      skills: tech.skills,
      area: tech.area,
      services: tech.services
    }));

    res.json(formattedTechs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mock Identity Verification Submission
// @route   POST /api/technicians/verify
const submitVerification = async (req, res) => {
  try {
    const tech = await Technician.findOne({ userId: req.user.id });
    if (!tech) return res.status(404).json({ message: 'Technician not found' });

    // In a real startup, you'd send data to Stripe Identity or Checkr here.
    // We instantly approve for MVP demonstration:
    tech.backgroundCheckStatus = 'approved';
    tech.isVerified = true;
    await tech.save();

    res.json({ message: 'Verification successful', tech });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Job Status (Accept, Start, Complete)
// @route   PUT /api/technicians/job-status
const updateJobStatus = async (req, res) => {
  const { jobId, action } = req.body; // action: 'accept', 'start', 'complete', 'reject'
  
  try {
    const tech = await Technician.findOne({ userId: req.user.id });
    if (!tech) return res.status(404).json({ message: 'Technician not found' });

    const job = await QuickBooking.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (action === 'accept') {
      job.status = 'Accepted';
      await job.save();
    } else if (action === 'start') {
      tech.currentStatus = 'on_the_way';
      tech.currentJobId = job._id;
      // tech will be busy for roughly 1.5 hrs
      tech.expectedAvailableTime = new Date(Date.now() + 90 * 60000); 
      await tech.save();
      
      job.status = 'On The Way';
      await job.save();
    } else if (action === 'complete') {
      tech.currentStatus = 'available';
      tech.currentJobId = null;
      tech.expectedAvailableTime = null;
      tech.jobsCompleted = (tech.jobsCompleted || 0) + 1;
      await tech.save();

      job.status = 'Completed';
      await job.save();

      // SMART REASSIGNMENT:
      // Check if there are queued ASAP jobs waiting for a technician
      const queuedJob = await QuickBooking.findOne({ status: 'Queued' }).sort({ createdAt: 1 });
      if (queuedJob) {
        queuedJob.technicianName = tech.name;
        queuedJob.technicianPhone = tech.phone || "+15551234567";
        queuedJob.status = "Assigned";
        queuedJob.isQueued = false;
        queuedJob.estimatedArrivalTime = new Date(Date.now() + 30 * 60000);
        await queuedJob.save();
        // Optional: Send push notification to tech here
      }
    } else if (action === 'reject') {
      // Re-assign to someone else if possible
      job.status = 'Pending';
      job.technicianName = 'Unassigned';
      await job.save();
      // Optional: trigger queue logic here to find another tech
    }

    res.json({ message: 'Job status updated', job, tech });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request withdrawal of earnings
// @route   POST /api/technicians/withdraw
const requestWithdrawal = async (req, res) => {
  const { amount, accountName, accountNumber, ifscCode, upiId } = req.body;
  try {
    const tech = await Technician.findOne({ userId: req.user.id });
    if (!tech) return res.status(404).json({ message: 'Technician not found' });

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 500) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is ₹500.' });
    }

    if (numAmount > tech.walletBalance) {
      return res.status(400).json({ message: 'Cannot withdraw more than available balance.' });
    }

    // Check for existing pending requests
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    const existingPending = await WithdrawalRequest.findOne({
      technicianId: req.user.id,
      status: 'pending'
    });
    if (existingPending) {
      return res.status(400).json({ message: 'You already have a pending withdrawal request. Please wait for admin processing.' });
    }

    // Create withdrawal request log
    const payoutReq = await WithdrawalRequest.create({
      technicianId: req.user.id,
      amount: numAmount,
      bankDetails: {
        accountName,
        accountNumber,
        ifscCode,
        upiId: upiId || ''
      },
      status: 'pending'
    });

    // Update pending fields in tech profile
    tech.pendingWithdrawal = (tech.pendingWithdrawal || 0) + numAmount;
    await tech.save();
    
    res.json({ message: 'Withdrawal request submitted successfully', payoutReq, tech });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit KYC details
// @route   POST /api/technicians/kyc
const submitKyc = async (req, res) => {
  const { accountName, accountNumber, ifscCode, idProofUrl } = req.body;
  try {
    const tech = await Technician.findOne({ userId: req.user.id });
    if (!tech) return res.status(404).json({ message: 'Technician not found' });
    
    tech.bankDetails = { accountName, accountNumber, ifscCode, idProofUrl };
    tech.kycCompleted = true;
    await tech.save();
    res.json({ message: 'KYC submitted successfully', tech });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile, getNearbyTechnicians, submitVerification, updateJobStatus, requestWithdrawal, submitKyc };
