const RepairRequest = require('../models/RepairRequest');
const Technician = require('../models/Technician');

// @desc    Create new repair request
// @route   POST /api/requests
// @access  Private (User)
const createRequest = async (req, res) => {
  const { problemDescription, deviceType, location } = req.body;

  try {
    const request = await RepairRequest.create({
      userId: req.user.id,
      problemDescription,
      deviceType,
      location,
      status: 'pending'
    });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's requests
// @route   GET /api/requests/myrequests
// @access  Private
const getMyRequests = async (req, res) => {
  try {
    const requests = await RepairRequest.find({ userId: req.user.id })
      .populate('technicianId', 'name rating')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available requests for technicians
// @route   GET /api/requests/available
// @access  Private (Technician)
const getAvailableRequests = async (req, res) => {
  try {
    const requests = await RepairRequest.find({ status: 'pending' })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept a request
// @route   PUT /api/requests/:id/accept
// @access  Private (Technician)
const acceptRequest = async (req, res) => {
  try {
    const request = await RepairRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is no longer pending' });
    }

    // Find technician profile
    const tech = await Technician.findOne({ userId: req.user.id });
    if (!tech) {
      return res.status(404).json({ message: 'Technician profile not found' });
    }

    request.technicianId = tech._id;
    request.status = 'accepted';
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update request status
// @route   PUT /api/requests/:id/status
// @access  Private (Technician/Admin)
const updateRequestStatus = async (req, res) => {
  const { status } = req.body;
  
  try {
    const request = await RepairRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Optional check: Ensure the correct technician is updating it
    
    request.status = status;
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getAvailableRequests,
  acceptRequest,
  updateRequestStatus
};
