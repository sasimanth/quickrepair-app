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
  services: { type: [String], default: [] },
  address: { type: String, default: '' },
  area: { type: String, default: '' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  rating: { type: Number, default: 4.8 },
  reviewCount: { type: Number, default: 0 },
  jobsCompleted: { type: Number, default: 0 },
  isProfileComplete: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  backgroundCheckStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'none'], default: 'none' },
  currentStatus: { type: String, enum: ['available', 'busy', 'on_the_way', 'offline'], default: 'available' },
  currentJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuickBooking', default: null },
  expectedAvailableTime: { type: Date, default: null },
  withdrawnAmount: { type: Number, default: 0 },
  pendingWithdrawal: { type: Number, default: 0 },
  kycCompleted: { type: Boolean, default: false },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    ifscCode: String,
    idProofUrl: String
  }
}, { timestamps: true });

// Crucial: 2dsphere index for GeoSpatial search
technicianSchema.index({ location: '2dsphere' });
technicianSchema.index({ area: 1 });
technicianSchema.index({ services: 1 });

module.exports = mongoose.model('Technician', technicianSchema);
