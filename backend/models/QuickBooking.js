const mongoose = require('mongoose');

const quickBookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  service: {
    type: String,
    required: true,
  },
  problem: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  technicianName: {
    type: String,
    default: "Unassigned",
  },
  technicianPhone: {
    type: String,
    default: "N/A",
  },
  status: {
    type: String,
    enum: ['Pending', 'Queued', 'Assigned', 'Accepted', 'On The Way', 'In Progress', 'Completed', 'Cancelled'],
    default: "Pending",
  },
  price: {
    type: Number,
    default: null,
  },
  timeSlot: {
    type: String,
    default: 'ASAP'
  },
  estimatedArrivalTime: {
    type: Date,
    default: null
  },
  isQueued: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('QuickBooking', quickBookingSchema);
