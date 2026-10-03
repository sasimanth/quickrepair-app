const Technician = require('../models/Technician');
const User = require('../models/User');
const QuickBooking = require('../models/QuickBooking');
const { encrypt, decrypt, isEncrypted, maskAccountNumber, maskIfscCode, hashDocument } = require('../utils/encryption');
const { validateIfscCode, validateAccountNumber, validateAccountName, validateDocumentFile, sanitizeText } = require('../utils/validators');
const { uploadPrivateDocument, getSignedDocumentUrl } = require('../services/cloudinaryService');

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
    
    // === SECURITY: Strip sensitive KYC fields from API response ===
    // Remove raw document data (base64 / Cloudinary publicIds)
    delete techObj.governmentIdUrl;
    delete techObj.selfieUrl;
    delete techObj.addressProofUrl;
    delete techObj.documents;

    // Replace bank details with masked versions for display
    if (techObj.bankDetails) {
      techObj.bankDetails = {
        accountName: techObj.bankDetails.accountName || '',
        accountNumberMasked: techObj.bankDetails.accountNumberMasked || maskAccountNumber(''),
        ifscCodeMasked: techObj.bankDetails.ifscCodeMasked || maskIfscCode(''),
        hasIdProof: !!(techObj.bankDetails.idProofUrl || tech.documents?.idProof?.publicId),
        verifiedAt: techObj.bankDetails.verifiedAt || null
      };
    }

    // Add KYC status flags for frontend display
    techObj.hasDocumentsSubmitted = !!(tech.documents?.governmentId?.publicId || tech.governmentIdUrl);
    techObj.kycStatus = tech.kycStatus || (tech.kycCompleted ? 'approved' : 'not_submitted');

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

    const { name, phone } = req.body;
    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;

    if (tech) {
      Object.assign(tech, updateFields);
      await tech.save();
    } else {
      const user = await User.findById(req.user.id);
      tech = await Technician.create({
        userId: req.user.id,
        name: name || (user ? user.name : 'Unknown Tech'),
        email: user ? user.email : '',
        phone: phone || (user ? user.phone : ''),
        ...updateFields
      });
    }

    // Also update User record so auth login reflects updated details
    const user = await User.findById(req.user.id);
    if (user) {
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (avatar) user.avatar = avatar;
      await user.save();
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

    const term = (search || area || '').trim();
    if (term) {
      const searchRegex = new RegExp(term, 'i');
      query.$or = [
        { name: searchRegex },
        { area: searchRegex },
        { address: searchRegex },
        { skills: searchRegex },
        { services: searchRegex }
      ];
    }
    if (serviceId) {
      query.services = serviceId;
    }

    let techs = await Technician.find(query).limit(30);
    
    techs.sort((a, b) => {
      return (b.rating || 0) - (a.rating || 0);
    });

    // Deduplicate by userId
    const seen = new Set();
    const uniqueTechs = [];
    for (const tech of techs) {
      const uid = tech.userId ? tech.userId.toString() : tech._id.toString();
      if (!seen.has(uid)) {
        seen.add(uid);
        uniqueTechs.push(tech);
      }
    }

    const formattedTechs = uniqueTechs.slice(0, 12).map((tech) => ({
      id: tech.userId ? tech.userId.toString() : tech._id.toString(),
      _id: tech.userId ? tech.userId.toString() : tech._id.toString(),
      name: tech.name,
      rating: (tech.rating || 4.8).toFixed(1),
      experience: tech.experience || '3+ Years',
      distance: tech.area || (term ? 'In your area' : 'Nearby'),
      jobsCompleted: tech.jobsCompleted || 0,
      isVerified: tech.isVerified || false,
      avatar: tech.avatar || '👨‍🔧',
      skills: tech.skills || [],
      area: tech.area || '',
      services: tech.services || []
    }));

    res.json(formattedTechs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retained for backward compatibility — new code uses validators.js
const validateBase64File = (base64String) => {
  return validateDocumentFile(base64String);
};

// @desc    Submit Identity Verification Documents (SECURED)
// @route   POST /api/technicians/verify
const submitVerification = async (req, res) => {
  const { governmentId, selfie, addressProof } = req.body;
  try {
    const tech = await Technician.findOne({ userId: req.user.id });
    if (!tech) return res.status(404).json({ error: true, code: 'TECH_NOT_FOUND', message: 'Technician not found' });

    // Prevent re-submission if already pending or under review
    if (['pending', 'under_review'].includes(tech.verificationStatus)) {
      return res.status(400).json({ 
        error: true, 
        code: 'VERIFICATION_ALREADY_PENDING', 
        message: 'Your verification is already pending admin review. Please wait for a response before resubmitting.' 
      });
    }

    // Validate all required documents
    if (!governmentId || !selfie || !addressProof) {
      return res.status(400).json({ error: true, code: 'MISSING_DOCUMENTS', message: 'All documents (Government ID, Selfie, and Address Proof) are required.' });
    }

    const idVal = validateDocumentFile(governmentId);
    if (!idVal.valid) return res.status(400).json({ error: true, message: `Government ID Error: ${idVal.message}` });

    const selfieVal = validateDocumentFile(selfie);
    if (!selfieVal.valid) return res.status(400).json({ error: true, message: `Selfie Error: ${selfieVal.message}` });

    const addrVal = validateDocumentFile(addressProof);
    if (!addrVal.valid) return res.status(400).json({ error: true, message: `Address Proof Error: ${addrVal.message}` });

    // === SECURITY: Upload to private Cloudinary storage ===
    // Only publicIds + hashes are stored in MongoDB — NOT raw base64
    const govIdHash = hashDocument(governmentId);
    const selfieHash = hashDocument(selfie);
    const addrHash = hashDocument(addressProof);

    // Duplicate document detection (same document used by another technician)
    try {
      const duplicateCheck = await Technician.findOne({
        userId: { $ne: req.user.id },
        $or: [
          { 'documents.governmentId.hash': govIdHash },
          { 'documents.addressProof.hash': addrHash }
        ]
      });
      if (duplicateCheck) {
        // Create security alert but don't block — admin will review
        const SecurityAlert = require('../models/SecurityAlert');
        await SecurityAlert.create({
          userId: req.user._id,
          userEmail: tech.email,
          alertType: 'KYC_DUPLICATE_DOCUMENT',
          severity: 'high',
          description: `Technician ${tech.name} (${tech.email}) submitted a document that matches another technician's KYC submission.`,
          metadata: { technicianId: req.user.id, matchedTechnicianId: duplicateCheck.userId }
        });
      }
    } catch (dupErr) {
      console.error('Duplicate document check failed (non-blocking):', dupErr.message);
    }

    // Upload documents to private cloud storage
    const [govUpload, selfieUpload, addrUpload] = await Promise.all([
      uploadPrivateDocument(governmentId, req.user.id, 'governmentId'),
      uploadPrivateDocument(selfie, req.user.id, 'selfie'),
      uploadPrivateDocument(addressProof, req.user.id, 'addressProof')
    ]);

    // Store only Cloudinary publicIds + hashes in MongoDB
    const now = new Date();
    tech.documents = {
      governmentId: { publicId: govUpload?.publicId || '', hash: govIdHash, uploadedAt: now },
      selfie: { publicId: selfieUpload?.publicId || '', hash: selfieHash, uploadedAt: now },
      addressProof: { publicId: addrUpload?.publicId || '', hash: addrHash, uploadedAt: now },
      idProof: (tech.documents && tech.documents.idProof && tech.documents.idProof.publicId) ? tech.documents.idProof : { publicId: '', hash: '', uploadedAt: now }
    };

    // Clear legacy base64 fields (DO NOT store raw document data in MongoDB)
    tech.governmentIdUrl = '';
    tech.selfieUrl = '';
    tech.addressProofUrl = '';

    tech.verificationStatus = 'pending';
    tech.backgroundCheckStatus = 'pending';
    tech.isVerified = false; // Revoke until approved by admin
    await tech.save();

    // Revoke verified status on User document until admin approves
    await User.findByIdAndUpdate(req.user.id, { isVerified: false });

    // Create audit log
    try {
      const AdminAuditLog = require('../models/AdminAuditLog');
      await AdminAuditLog.create({
        adminId: req.user._id,
        adminName: tech.name,
        adminEmail: tech.email,
        action: 'KYC_SUBMITTED',
        targetId: req.user.id,
        targetType: 'Technician',
        details: { 
          techName: tech.name,
          documentsUploaded: ['governmentId', 'selfie', 'addressProof'],
          previousStatus: tech.verificationStatus
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (auditErr) {
      console.error('Failed to create KYC audit log:', auditErr.message);
    }

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

    // SECURITY: Return only status — NOT the full tech object
    res.json({ 
      message: 'Verification documents submitted successfully. Status is now Pending Review.', 
      verificationStatus: 'pending',
      hasDocumentsSubmitted: true
    });
  } catch (error) {
    console.error('submitVerification error:', error);
    res.status(500).json({ error: true, message: 'Failed to submit verification documents. Please try again.' });
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
    // === SECURITY: Require both identity verification AND bank KYC approval for withdrawals ===
    const kycApproved = tech.kycStatus === 'approved' || tech.kycCompleted; // Legacy backward compat
    if (!kycApproved || !tech.bankDetails || !tech.bankDetails.accountNumber || !tech.bankDetails.accountName || !tech.bankDetails.ifscCode) {
      return res.status(400).json({ 
        error: true, 
        code: 'KYC_NOT_APPROVED',
        message: 'KYC and bank details must be completed and approved by admin before requesting withdrawal.',
        kycStatus: tech.kycStatus || 'not_submitted',
        verificationStatus: tech.verificationStatus || 'unverified'
      });
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


// @desc    Submit KYC / Bank Details (SECURED — requires admin approval)
// @route   POST /api/technicians/kyc
const submitKyc = async (req, res) => {
  const { accountName, accountNumber, ifscCode, idProofUrl, consentGranted, consentToKycProcessing } = req.body;
  try {
    const tech = await Technician.findOne({ userId: req.user.id });
    if (!tech) return res.status(404).json({ error: true, code: 'TECH_NOT_FOUND', message: 'Technician not found' });

    // === SECURITY: Require explicit consent (DPDPA 2023 compliance) ===
    const isConsentGiven = consentGranted || consentToKycProcessing;
    if (!isConsentGiven) {
      return res.status(400).json({ 
        error: true, 
        code: 'CONSENT_REQUIRED', 
        message: 'Explicit consent is required for processing KYC and bank data.' 
      });
    }

    // Prevent re-submission if already pending review
    if (tech.kycStatus === 'pending_review') {
      return res.status(400).json({ 
        error: true, 
        code: 'KYC_ALREADY_PENDING', 
        message: 'Your KYC is already pending admin review. Please wait for approval.' 
      });
    }

    // === Validate all inputs ===
    const nameVal = validateAccountName(accountName);
    if (!nameVal.valid) return res.status(400).json({ error: true, message: nameVal.message });

    const acctVal = validateAccountNumber(accountNumber);
    if (!acctVal.valid) return res.status(400).json({ error: true, message: acctVal.message });

    const ifscVal = validateIfscCode(ifscCode);
    if (!ifscVal.valid) return res.status(400).json({ error: true, message: ifscVal.message });

    // === SECURITY: Detect suspicious bank detail changes ===
    if (tech.bankDetails?.accountNumber && tech.kycStatus === 'approved') {
      try {
        const SecurityAlert = require('../models/SecurityAlert');
        await SecurityAlert.create({
          userId: req.user._id,
          userEmail: tech.email,
          alertType: 'KYC_SUSPICIOUS_BANK_CHANGE',
          severity: 'medium',
          description: `Technician ${tech.name} (${tech.email}) changed bank details after KYC was already approved.`,
          metadata: { technicianId: req.user.id }
        });
      } catch (alertErr) {
        console.error('Failed to create bank change alert:', alertErr.message);
      }
    }

    // === SECURITY: Encrypt sensitive bank fields before storage ===
    const encryptedAccountNumber = encrypt(accountNumber.trim());
    const encryptedIfscCode = encrypt(ifscCode.trim().toUpperCase());

    // Upload ID proof document to private storage if provided
    let idProofDocRef = tech.documents?.idProof || {};
    if (idProofUrl && !idProofUrl.startsWith('http')) {
      const idProofUpload = await uploadPrivateDocument(idProofUrl, req.user.id, 'idProof');
      if (idProofUpload) {
        idProofDocRef = { publicId: idProofUpload.publicId, hash: hashDocument(idProofUrl), uploadedAt: new Date() };
      }
    }
    
    tech.bankDetails = { 
      accountName: sanitizeText(accountName.trim(), 100), 
      accountNumber: encryptedAccountNumber,
      accountNumberMasked: maskAccountNumber(accountNumber.trim()),
      ifscCode: encryptedIfscCode,
      ifscCodeMasked: maskIfscCode(ifscCode.trim().toUpperCase()),
      idProofUrl: idProofUrl && idProofUrl.startsWith('http') ? idProofUrl : '', // Legacy compat
      verifiedAt: null // Will be set by admin on approval
    };

    // Update documents sub-schema
    if (!tech.documents) tech.documents = {};
    tech.documents.idProof = idProofDocRef;
    tech.markModified('documents');

    // === CRITICAL: Do NOT auto-approve — require admin review ===
    tech.kycStatus = 'pending_review';
    tech.kycSubmittedAt = new Date();
    tech.kycCompleted = false; // Legacy field — stays false until admin approves
    tech.kycRejectionReason = ''; // Clear any previous rejection reason

    // Record consent (DPDPA 2023 compliance)
    if (consentGranted) {
      tech.kycConsentGrantedAt = new Date();
      tech.kycConsentVersion = '1.0';
    }

    await tech.save();

    // Create audit log
    try {
      const AdminAuditLog = require('../models/AdminAuditLog');
      await AdminAuditLog.create({
        adminId: req.user._id,
        adminName: tech.name,
        adminEmail: tech.email,
        action: 'KYC_SUBMITTED',
        targetId: req.user.id,
        targetType: 'Technician',
        details: { 
          techName: tech.name,
          kycType: 'bank_details',
          hasIdProof: !!idProofUrl
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (auditErr) {
      console.error('Failed to create KYC audit log:', auditErr.message);
    }

    // Notify admin about new KYC submission
    try {
      const { notifyUser } = require('../services/NotificationService');
      notifyUser({
        email: process.env.ADMIN_EMAIL || 'admin@fixvo.com',
        type: 'email',
        subject: `New KYC Submission from ${tech.name} 🏦`,
        text: `Technician ${tech.name} has submitted bank details for KYC verification. Please review in the Admin Dashboard.`,
        templateName: 'adminNewTechRegistration',
        templateData: {
          techName: tech.name,
          specialties: 'Bank KYC Review',
          url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin-dashboard`
        }
      }).catch(err => console.error('Failed to notify admin on KYC submission:', err));
    } catch (e) {
      console.error('Failed to initiate admin notification for KYC:', e);
    }

    // SECURITY: Return only status confirmation — NOT the full tech object with encrypted data
    res.json({ 
      message: 'KYC submitted successfully. Your bank details are pending admin verification.', 
      kycStatus: 'pending_review',
      bankDetails: {
        accountName: tech.bankDetails.accountName,
        accountNumberMasked: tech.bankDetails.accountNumberMasked,
        ifscCodeMasked: tech.bankDetails.ifscCodeMasked
      }
    });
  } catch (error) {
    console.error('submitKyc error:', error);
    res.status(500).json({ error: true, message: 'Failed to submit KYC details. Please try again.' });
  }
};

module.exports = { getProfile, updateProfile, getNearbyTechnicians, submitVerification, updateJobStatus, requestWithdrawal, submitKyc, calculateTechnicianWallet };
