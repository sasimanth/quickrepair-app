const mongoose = require('mongoose');

const repairRequestSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  technicianId: {
    type: String,
    default: null
  },
  problemDescription: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('RepairRequest', repairRequestSchema);
