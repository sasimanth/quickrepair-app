const Technician = require('../models/Technician');

// @desc    Get or create technician profile
// @route   GET /api/technicians/profile
const getProfile = async (req, res) => {
  try {
    let tech = await Technician.findOne({ userId: req.user.id });
    if (!tech) {
      // Create a default placeholder if none exists
      tech = await Technician.create({
        userId: req.user.id,
        name: req.user.user_metadata?.name || req.user.email.split('@')[0],
        email: req.user.email,
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
  const { address, lat, lng, skills, experience, avatar } = req.body;
  try {
    let tech = await Technician.findOne({ userId: req.user.id });
    
    // Convert array components if skills is string
    const skillsArray = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : tech?.skills);

    const updateFields = {
      address: address || tech?.address,
      skills: skillsArray,
      experience: experience || tech?.experience,
      avatar: avatar || tech?.avatar,
      isProfileComplete: true
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
      tech = await Technician.create({
        userId: req.user.id,
        name: req.user.user_metadata?.name || req.user.email.split('@')[0],
        email: req.user.email,
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
      return res.json(genericTechs);
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
      isProfileComplete: true
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
      avatar: tech.avatar,
      skills: tech.skills
    }));

    res.json(formattedTechs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile, getNearbyTechnicians };
