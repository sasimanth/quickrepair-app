const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true // One review per booking
  },
  userId: {
    type: String, // InsForge User ID
    required: true
  },
  technicianId: {
    type: String, // InsForge Technician ID
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  ratingQuality: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  ratingCommunication: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  ratingTimeliness: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  ratingValue: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
