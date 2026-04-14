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
    res.json(tech);
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

// @desc    Find nearby technicians (GeoSpatial Query)
// @route   GET /api/technicians/nearby
const getNearbyTechnicians = async (req, res) => {
  const { lat, lng, maxDistance = 50000 } = req.query; // maxDistance in meters (default 50km)

  try {
    if (!lat || !lng) {
      // Fallback: Just return 5 random completed profiles if no location provided
      const genericTechs = await Technician.find({ isProfileComplete: true }).limit(5);
      const formattedGeneric = genericTechs.map((tech, i) => ({
        id: tech.userId,
        name: tech.name,
        rating: tech.rating.toFixed(1),
        experience: tech.experience,
        distance: `${(i * 1.5 + 2.0).toFixed(1)} miles`,
        jobsCompleted: tech.jobsCompleted,
        avatar: tech.avatar,
        skills: tech.skills
      }));
      return res.json(formattedGeneric);
    }

    const nearbyTechs = await Technician.find({
      location: {
        $near: {
          $geometry: {
             type: "Point",
             coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      isProfileComplete: true,
      isOnline: true
    }).limit(10);

    // Map distance property loosely based on index position for the MVP UI
    // (A real robust implementation would use MongoDB's aggregation pipeline $geoNear to extract exact distance)
    const formattedTechs = nearbyTechs.map((tech, i) => ({
      id: tech.userId, // Expose the InsForge ID so bookings work natively
      name: tech.name,
      rating: tech.rating.toFixed(1),
      experience: tech.experience,
      distance: `${(i * 0.5 + 0.8).toFixed(1)} miles`, // Simulated distance string for MVP UI based on proximity sorting
      jobsCompleted: tech.jobsCompleted,
      isVerified: tech.isVerified,
      avatar: tech.avatar,
      skills: tech.skills
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

module.exports = { getProfile, updateProfile, getNearbyTechnicians, submitVerification, updateJobStatus };
