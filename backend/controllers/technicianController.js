const Technician = require('../models/Technician');
const User = require('../models/User');
const QuickBooking = require('../models/QuickBooking');

// @desc    Get or create technician profile
// @route   GET /api/technicians/profile
const calculateTechnicianWallet = async (userId) => {
  const Booking = require('../models/Booking');
  const WithdrawalRequest = require('../models/WithdrawalRequest');
  
  // Fetch bookings
  const bookings = await Booking.find({ providerId: userId });
  const completedBookings = bookings.filter(b => b.status === 'completed');
  
  // 1. Gross Earnings: Sum of finalQuote || amount for completed bookings
  const grossEarnings = completedBookings.reduce((sum, b) => {
    return sum + (b.finalQuote || b.amount || 0);
  }, 0);

  // 2. Platform Fee (10% of gross)
  const platformFee = grossEarnings * 0.10;

  // 3. Net Earnings (90% of gross)
  const netEarnings = grossEarnings - platformFee;

  // 4. Cash Collected: Gross amount of completed bookings where paymentMethod === 'cash' and paymentStatus === 'completed'
  const cashBookings = completedBookings.filter(b => b.paymentMethod === 'cash' && b.paymentStatus === 'completed');
  const cashCollected = cashBookings.reduce((sum, b) => {
    return sum + (b.finalQuote || b.amount || 0);
  }, 0);

  // 5. Online Payments: Gross amount of completed bookings where paymentMethod !== 'cash' and paymentStatus === 'completed'
  const onlineBookings = completedBookings.filter(b => b.paymentMethod !== 'cash' && b.paymentStatus === 'completed');
  const onlinePayments = onlineBookings.reduce((sum, b) => {
    return sum + (b.finalQuote || b.amount || 0);
  }, 0);

  // 6. Platform Due: 10% of cashCollected
  const platformDue = cashCollected * 0.10;

  // Fetch withdrawals
  const withdrawals = await WithdrawalRequest.find({ technicianId: userId });
  
  // 7. Withdrawn: Paid withdrawal requests
  const withdrawn = withdrawals
    .filter(w => w.status === 'paid')
    .reduce((sum, w) => sum + w.amount, 0);

  // Pending withdrawals
  const pendingWithdrawal = withdrawals
    .filter(w => w.status === 'pending' || w.status === 'approved')
    .reduce((sum, w) => sum + w.amount, 0);

  // 8. Pending Clearance: Net earnings (90%) of completed online bookings that are NOT paid yet (paymentStatus !== 'completed')
  const pendingClearance = completedBookings
    .filter(b => b.paymentMethod !== 'cash' && b.paymentStatus !== 'completed')
    .reduce((sum, b) => {
      const grossVal = b.finalQuote || b.amount || 0;
      return sum + (grossVal * 0.90);
    }, 0);

  // 9. Available Balance: (Online Payments * 0.90) - Platform Due - Withdrawn - Pending Withdrawal (clamped at 0)
  const availableBalance = Math.max(0, (onlinePayments * 0.90) - platformDue - withdrawn - pendingWithdrawal);

  return {
    grossEarnings,
    platformFee,
    netEarnings,
    cashCollected,
    onlinePayments,
    platformDue,
    withdrawn,
    pendingWithdrawal,
    pendingClearance,
    availableBalance
  };
};

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

    const walletStats = await calculateTechnicianWallet(req.user.id);

    // Persist correct values in DB
    tech.withdrawnAmount = walletStats.withdrawn;
    tech.pendingWithdrawal = walletStats.pendingWithdrawal;
    tech.walletBalance = walletStats.availableBalance;
    tech.totalEarnings = walletStats.netEarnings;
    await tech.save();

    const WithdrawalRequest = require('../models/WithdrawalRequest');
    const withdrawals = await WithdrawalRequest.find({ technicianId: req.user.id }).sort({ createdAt: -1 });

    const techObj = tech.toObject();
    techObj.withdrawals = withdrawals;
    
    // Attach dynamically calculated statistics
    techObj.grossEarnings = walletStats.grossEarnings;
    techObj.platformFee = walletStats.platformFee;
    techObj.netEarnings = walletStats.netEarnings;
    techObj.cashCollected = walletStats.cashCollected;
    techObj.onlinePayments = walletStats.onlinePayments;
    techObj.platformDue = walletStats.platformDue;
    techObj.withdrawn = walletStats.withdrawn;
    techObj.pendingWithdrawal = walletStats.pendingWithdrawal;
    techObj.pendingClearance = walletStats.pendingClearance;
    techObj.availableBalance = walletStats.availableBalance;

    // Backward compatibility fields
    techObj.totalEarned = walletStats.grossEarnings;
    techObj.platformCommission = walletStats.platformFee;
    techObj.pendingEarnings = walletStats.pendingClearance;

    res.json(techObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update technician profile (Location, Skills, etc)
// @route   PUT /api/technicians/profile
const updateProfile = async (req, res) => {
  const { address, area, lat, lng, skills, experience, avatar, isOnline } = req.body;
  try {
    let tech = await Technician.findOne({ userId: req.user.id });
    
    // Convert array components if skills is string
    const skillsArray = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : null);

    const serviceIdToName = {
      'ac_repair': 'AC Repair',
      'washing_machine': 'Washing Machine Repair',
      'refrigerator': 'Refrigerator Repair',
      'microwave': 'Microwave Repair',
      'tv_repair': 'TV Repair',
      'laptop_repair': 'Laptop Repair',
      'mobile_repair': 'Mobile Repair',
      'ac_install': 'AC Installation',
      'cctv_install': 'CCTV Installation',
      'ro_install': 'RO Installation',
      'inverter_install': 'Inverter Installation',
      'fan_install': 'Ceiling Fan Installation',
      'lock_install': 'Door Lock Installation',
      'furniture': 'Furniture Assembly',
      'sofa_clean': 'Sofa Cleaning',
      'bathroom_clean': 'Bathroom Deep Cleaning',
      'water_tank_clean': 'Water Tank Cleaning',
      'carpet_clean': 'Carpet Cleaning',
      'kitchen_clean': 'Kitchen Cleaning',
      'home_clean': 'Full Home Cleaning',
      'pest_control': 'Pest Control',
      'electric_wiring': 'Electric Wiring',
      'plumbing_work': 'Plumbing Work',
      'furniture_repair': 'Furniture Repair',
      'painting': 'Painting'
    };

    const isServiceId = (s) => Object.keys(serviceIdToName).includes(s);
    let selectedServices = tech?.services || [];
    let selectedSkills = tech?.skills || [];
    
    if (skillsArray && skillsArray.length > 0) {
      if (skillsArray.every(s => isServiceId(s))) {
        selectedServices = skillsArray;
        selectedSkills = skillsArray.map(s => serviceIdToName[s] || s);
      } else {
        selectedSkills = skillsArray;
        const nameToServiceId = Object.entries(serviceIdToName).reduce((acc, [k, v]) => {
          acc[v.toLowerCase()] = k;
          return acc;
        }, {});
        selectedServices = skillsArray.map(s => nameToServiceId[s.toLowerCase()] || s).filter(Boolean);
      }
    }

    const updateFields = {
      address: address || tech?.address,
      area: area || tech?.area || address,
      skills: selectedSkills,
      services: selectedServices,
      experience: experience || tech?.experience,
      avatar: avatar || tech?.avatar,
      isProfileComplete: true,
      ...(isOnline !== undefined && { 
        isOnline,
        currentStatus: isOnline ? 'available' : 'offline'
      })
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
        phone: user ? user.phone : '',
        ...updateFields
      });
    }

    res.json(tech);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNearbyTechnicians = async (req, res) => {
  const { area, serviceId, search } = req.query;

  try {
    let query = {
      isProfileComplete: true,
      isOnline: true
    };

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { area: searchRegex },
        { skills: searchRegex },
        { services: searchRegex }
      ];
    } else {
      if (area) {
        // Area match (case-insensitive)
        query.area = { $regex: new RegExp(`^${area}$`, 'i') };
      }
      if (serviceId) {
        query.services = serviceId;
      }
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

const validateBase64File = (base64String) => {
  if (!base64String) return { valid: false, message: 'File is required' };
  
  // Check if it's already a URL (e.g. from seeded database scripts or fallback)
  if (base64String.startsWith('http://') || base64String.startsWith('https://')) {
    return { valid: true, isUrl: true };
  }
  
  const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches) {
    return { valid: false, message: 'Invalid file format. Must be a valid Base64 data URL.' };
  }
  
  const mimeType = matches[1];
  const base64Content = matches[2];
  
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
  if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
    return { valid: false, message: `Invalid file type: ${mimeType}. Only PNG, JPEG, and PDF are allowed.` };
  }
  
  // Estimate size
  const estimatedSize = (base64Content.length * 3) / 4;
  if (estimatedSize > 5 * 1024 * 1024) {
    return { valid: false, message: 'File size exceeds maximum limit of 5MB.' };
  }
  
  // Verify magic bytes
  const buffer = Buffer.from(base64Content.substring(0, 32), 'base64');
  
  let isMagicValid = false;
  if (mimeType.includes('png')) {
    isMagicValid = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    isMagicValid = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  } else if (mimeType.includes('pdf')) {
    isMagicValid = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }
  
  if (!isMagicValid) {
    return { valid: false, message: 'MIME type mismatch. The file contents do not match its extension.' };
  }
  
  return { valid: true, mimeType, isUrl: false };
};

// @desc    Submit Identity Verification Documents
// @route   POST /api/technicians/verify
const submitVerification = async (req, res) => {
  const { governmentId, selfie, addressProof } = req.body;
  try {
    const tech = await Technician.findOne({ userId: req.user.id });
    if (!tech) return res.status(404).json({ message: 'Technician not found' });

    // Validate inputs
    if (!governmentId || !selfie || !addressProof) {
      return res.status(400).json({ message: 'All documents (Government ID, Selfie, and Address Proof) are required.' });
    }

    const idVal = validateBase64File(governmentId);
    if (!idVal.valid) return res.status(400).json({ message: `Government ID Error: ${idVal.message}` });

    const selfieVal = validateBase64File(selfie);
    if (!selfieVal.valid) return res.status(400).json({ message: `Selfie Error: ${selfieVal.message}` });

    const addrVal = validateBase64File(addressProof);
    if (!addrVal.valid) return res.status(400).json({ message: `Address Proof Error: ${addrVal.message}` });

    // Save Base64 or URL data
    tech.governmentIdUrl = governmentId;
    tech.selfieUrl = selfieie || selfie; // backward compatibility or direct assignment
    tech.selfieUrl = selfie;
    tech.addressProofUrl = addressProof;
    tech.verificationStatus = 'pending';
    tech.backgroundCheckStatus = 'pending';
    tech.isVerified = false; // Revoke until approved by admin
    await tech.save();

    // Revoke verified status on User document until admin approves
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, { isVerified: false });

    // Send email/notification to admin asynchronously about new review request
    try {
      const { notifyUser } = require('../services/NotificationService');
      notifyUser({
        email: process.env.ADMIN_EMAIL || 'admin@fixvo.com',
        type: 'email',
        subject: `New Technician Verification Submitted: ${tech.name} 💼`,
        text: `Technician ${tech.name} has submitted documents for verification. Please review them in the Admin Dashboard.`,
        templateName: 'adminNewTechRegistration',
        templateData: {
          techName: tech.name,
          specialties: tech.skills?.join(', ') || 'General',
          url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin-dashboard`
        }
      }).catch(err => console.error('Failed to notify admin on verification submission:', err));
    } catch (e) {
      console.error('Failed to initiate admin notification for technician review:', e);
    }

    res.json({ message: 'Verification documents submitted successfully. Status is now Pending Review.', tech });
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

    // Enforce KYC and bank details checks
    if (!tech.kycCompleted || !tech.bankDetails || !tech.bankDetails.accountNumber || !tech.bankDetails.accountName || !tech.bankDetails.ifscCode) {
      return res.status(400).json({ message: 'KYC and bank details must be completed and approved before requesting withdrawal.' });
    }

    // Recalculate dynamic wallet stats before validating withdrawal
    const walletStats = await calculateTechnicianWallet(req.user.id);
    tech.walletBalance = walletStats.availableBalance;
    tech.totalEarnings = walletStats.netEarnings;
    tech.withdrawnAmount = walletStats.withdrawn;
    tech.pendingWithdrawal = walletStats.pendingWithdrawal;
    await tech.save();

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 500) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is ₹500.' });
    }

    if (numAmount > tech.walletBalance) {
      return res.status(400).json({ message: 'Cannot withdraw more than available balance.' });
    }

    // Check for existing pending requests in the database
    const WithdrawalRequest = require('../models/WithdrawalRequest');
    const existingPending = await WithdrawalRequest.findOne({
      technicianId: req.user.id,
      status: 'pending'
    });
    if (existingPending) {
      return res.status(400).json({ message: 'You already have a pending withdrawal request. Please wait for admin processing.' });
    }

    // Atomically lock and update Technician document to prevent race conditions & double-spending
    const updatedTech = await Technician.findOneAndUpdate(
      {
        userId: req.user.id,
        walletBalance: { $gte: numAmount },
        $or: [
          { pendingWithdrawal: 0 },
          { pendingWithdrawal: { $exists: false } }
        ]
      },
      {
        $set: {
          walletBalance: walletStats.availableBalance - numAmount,
          pendingWithdrawal: numAmount
        }
      },
      { new: true }
    );

    if (!updatedTech) {
      return res.status(400).json({ 
        message: 'Withdrawal request denied. You already have a pending withdrawal request or your balance is insufficient.' 
      });
    }

    // Create withdrawal request log
    const payoutReq = await WithdrawalRequest.create({
      technicianId: req.user.id,
      amount: numAmount,
      bankDetails: {
        accountName: accountName || tech.bankDetails.accountName,
        accountNumber: accountNumber || tech.bankDetails.accountNumber,
        ifscCode: ifscCode || tech.bankDetails.ifscCode,
        upiId: upiId || ''
      },
      status: 'pending'
    });
    
    // Send email to admin asynchronously
    try {
      const { notifyUser } = require('../services/NotificationService');
      notifyUser({
        email: process.env.ADMIN_EMAIL || 'admin@fixvo.com',
        type: 'email',
        subject: `New Withdrawal Request from ${tech.name} 💰`,
        text: `${tech.name} has submitted a withdrawal request of ₹${numAmount}. Please review and approve.`,
        templateName: 'adminWithdrawalRequest',
        templateData: {
          techName: tech.name,
          amount: numAmount,
          balance: updatedTech.walletBalance + numAmount, // Available balance before this deduction
          url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin-dashboard`
        }
      }).catch(err => console.error('Failed to notify admin on withdrawal request:', err));
    } catch (e) {
      console.error('Failed to initiate admin notification for withdrawal:', e);
    }

    res.json({ message: 'Withdrawal request submitted successfully', payoutReq, tech: updatedTech });
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

module.exports = { getProfile, updateProfile, getNearbyTechnicians, submitVerification, updateJobStatus, requestWithdrawal, submitKyc, calculateTechnicianWallet };
