const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  experience: { type: String, default: '1 year' },
  avatar: { type: String, default: '👨‍🔧' },
  skills: { type: [String], default: [] },
  address: { type: String, default: '' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  rating: { type: Number, default: 4.8 },
  jobsCompleted: { type: Number, default: 0 },
  isProfileComplete: { type: Boolean, default: false }
}, { timestamps: true });

// Crucial: 2dsphere index for GeoSpatial search
technicianSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Technician', technicianSchema);
