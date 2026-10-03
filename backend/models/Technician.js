const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
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
  verificationStatus: { type: String, enum: ['unverified', 'pending', 'under_review', 'approved', 'rejected'], default: 'unverified' },

  // === KYC Document References (Cloudinary publicIds — NOT raw base64/URLs) ===
  documents: {
    governmentId: { publicId: String, hash: String, uploadedAt: Date },
    selfie: { publicId: String, hash: String, uploadedAt: Date },
    addressProof: { publicId: String, hash: String, uploadedAt: Date },
    idProof: { publicId: String, hash: String, uploadedAt: Date }
  },

  // Legacy fields — kept for backward compatibility with existing data
  // New uploads will use `documents` sub-schema above instead
  governmentIdUrl: { type: String, default: '' },
  selfieUrl: { type: String, default: '' },
  addressProofUrl: { type: String, default: '' },

  currentStatus: { type: String, enum: ['online', 'offline', 'busy', 'on_job', 'available', 'on_the_way'], default: 'online' },
  currentJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuickBooking', default: null },
  expectedAvailableTime: { type: Date, default: null },
  withdrawnAmount: { type: Number, default: 0 },
  pendingWithdrawal: { type: Number, default: 0 },

  // === KYC Status Lifecycle (replaces `kycCompleted` boolean) ===
  kycCompleted: { type: Boolean, default: false }, // Legacy — kept for backward compat
  kycStatus: { 
    type: String, 
    enum: ['not_submitted', 'pending_review', 'approved', 'rejected', 'expired'], 
    default: 'not_submitted' 
  },
  kycSubmittedAt: { type: Date },
  kycReviewedAt: { type: Date },
  kycReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  kycRejectionReason: { type: String, default: '' },

  // === Bank Details (accountNumber and ifscCode are encrypted at rest) ===
  bankDetails: {
    accountName: String,
    bankName: String,
    accountNumber: String,        // Encrypted (AES-256-GCM iv:tag:ciphertext)
    accountNumberEncrypted: String,
    accountNumberMasked: String,  // Display-safe: "XXXX XXXX 5678"
    ifscCode: String,             // Encrypted (AES-256-GCM iv:tag:ciphertext)
    ifscCodeEncrypted: String,
    ifscCodeMasked: String,       // Display-safe: "HDFC****34"
    idProofUrl: String,           // Legacy — new uploads use documents.idProof
    verifiedAt: Date
  },

  // === Consent Tracking (DPDPA 2023 compliance) ===
  kycConsentGrantedAt: { type: Date },
  kycConsentVersion: { type: String, default: '' },

  walletBalance: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 }
}, { timestamps: true });

// Crucial: 2dsphere index for GeoSpatial search
technicianSchema.index({ location: '2dsphere' });
technicianSchema.index({ area: 1 });
technicianSchema.index({ services: 1 });

module.exports = mongoose.model('Technician', technicianSchema);

