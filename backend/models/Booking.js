const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: String, // Kept as String to maintain backward compatibility with legacy BSON data
    default: null,
  },
  userEmail: {
    type: String,
    default: null,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  serviceId: {
    type: String,
    default: null,
  },
  serviceName: {
    type: String,
    required: true,
  },
  providerId: {
    type: String, // Accepts UUID from InsForge
    default: null,
  },
  providerEmail: {
    type: String,
    default: null,
  },
  providerPhone: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'queued', 'assigned', 'accepted', 'on_the_way', 'arrived', 'inspection_started', 'quote_pending', 'quote_approved', 'quote_rejected', 'quote_clarification', 'in_progress', 'completed', 'rejected', 'cancelled'],
    default: 'pending',
  },
  date: {
    type: Date,
    required: true,
  },
  deviceType: {
    type: String,
    default: 'Unknown Device',
  },
  problemDescription: {
    type: String,
    required: true, // Will map to 'problem' from BookingFlow
  },
  problemId: {
    type: String,
    default: null,
  },
  problemIds: {
    type: [String],
    default: []
  },
  location: {
    type: String,
    required: true, // Will map to 'address' from BookingFlow
  },
  landmark: {
    type: String,
    default: null
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  mapsLink: {
    type: String,
    default: ""
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
  },
  imageUrl: {
    type: String,
    default: '',
  },
  mediaUrl: {
    type: String,
    default: ''
  },
  mediaType: {
    type: String,
    default: ''
  },
  isReviewed: {
    type: Boolean,
    default: false
  },
  serviceCharge: {
    type: Number,
    default: 0
  },
  sparePartsCost: {
    type: Number,
    default: 0
  },
  finalQuote: {
    type: Number,
    default: null
  },
  quoteReason: {
    type: String,
    default: null
  },
  detectedIssues: {
    type: String,
    default: null
  },
  quotePhoto: {
    type: String,
    default: null
  },
  quoteApproved: {
    type: Boolean,
    default: false
  },
  unknownProblem: {
    type: Boolean,
    default: false
  },
  serviceOption: {
    type: String,
    enum: ['inspection', 'direct'],
    default: 'direct'
  },
  inspectionFee: {
    type: Number,
    default: 0
  },
  hasSpace: {
    type: Boolean,
    default: true
  },
  serviceLocation: {
    type: String,
    enum: ['on-site', 'off-site', 'gate'],
    default: 'on-site'
  },
  isRestrictedArea: {
    type: Boolean,
    default: false
  },
  isUnderWarranty: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'awaiting_payment', 'processing', 'completed', 'failed', 'refunded', 'cash_pending'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'upi', 'mock', 'razorpay'],
    default: 'cash'
  },
  transactionId: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    default: 0
  },
  platformCommission: {
    type: Number,
    default: 0
  },
  membershipDiscount: {
    type: Number,
    default: 0
  },
  finalTechnicianEarning: {
    type: Number,
    default: 0
  },
  isPremiumUser: {
    type: Boolean,
    default: false
  },
  emergencyCharge: {
    type: Number,
    default: 0
  },
  walletUpdated: {
    type: Boolean,
    default: false
  },
  promoCode: {
    type: String,
    default: null
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  areaType: {
    type: String,
    enum: ['campus', 'nearby', 'far'],
    default: 'nearby'
  },
  transportCharge: {
    type: Number,
    default: 50
  },
  transportOption: {
    type: String,
    enum: ['shop', 'doorstep'],
    default: 'doorstep'
  },
  // Dynamic fields based on service category
  areaSize: { type: String, default: null },
  houseType: { type: String, default: null },
  numberOfRooms: { type: String, default: null },
  wallArea: { type: String, default: null },
  indoorOutdoor: { type: String, default: null },
  paintPreference: { type: String, default: null },
  applianceType: { type: String, default: null },
  installationLocation: { type: String, default: null },
  accessoriesNeeded: { type: String, default: null },
  // Cancellation tracking
  cancellationReason: { type: String, default: null },
  cancelledBy: { type: String, enum: ['customer', 'technician', 'admin', null], default: null },
  cancelledAt: { type: Date, default: null },
  // Rejection tracking
  rejectionReason: { type: String, default: null },
  rejectedByTechName: { type: String, default: null },
  rejectedTechnicians: { type: [String], default: [] },
  quoteRevisions: [
    {
      version: Number,
      serviceCharge: Number,
      sparePartsCost: Number,
      transportCharge: Number,
      finalQuote: Number,
      quoteReason: String,
      detectedIssues: String,
      quotePhoto: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'clarification_requested'],
        default: 'pending'
      },
      clarificationText: String,
      clarificationResponse: String,
      approvedAt: Date,
      rejectedAt: Date,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  preRevisionStatus: { type: String, default: null },
  timelineEvents: [
    {
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      description: { type: String, required: true }
    }
  ]
}, { timestamps: true });

// Pre-save hook to populate timeline events on status and paymentStatus changes
bookingSchema.pre('save', function(next) {
  if (this.isNew) {
    if (!this.timelineEvents || this.timelineEvents.length === 0) {
      this.timelineEvents = [{
        status: this.status || 'pending',
        timestamp: new Date(),
        description: 'Booking created and submitted successfully.'
      }];
    }
  } else {
    if (this.isModified('status')) {
      let desc = `Booking status updated to ${this.status}.`;
      switch(this.status) {
        case 'pending':
          desc = 'Booking is pending technician matching.';
          break;
        case 'assigned':
          desc = 'Matching technician found. Waiting for acceptance.';
          break;
        case 'accepted':
          desc = 'Technician accepted the booking request.';
          break;
        case 'on_the_way':
          desc = 'Technician is on the way to your location.';
          break;
        case 'arrived':
          desc = 'Technician has arrived at your location.';
          break;
        case 'inspection_started':
          desc = 'Technician has started inspecting the problem.';
          break;
        case 'quote_pending':
          desc = 'Technician submitted a job quote for approval.';
          break;
        case 'quote_approved':
          desc = 'Quote approved. Work is in progress.';
          break;
        case 'quote_rejected':
          desc = 'Quote rejected by customer.';
          break;
        case 'quote_clarification':
          desc = 'Clarification requested on the submitted quote.';
          break;
        case 'in_progress':
          desc = 'Service repair work is in progress.';
          break;
        case 'completed':
          desc = 'Service completed. Awaiting payment.';
          break;
        case 'cancelled':
          desc = `Booking cancelled by ${this.cancelledBy || 'user'}.`;
          if (this.cancellationReason) desc += ` Reason: ${this.cancellationReason}`;
          break;
        case 'rejected':
          desc = 'Technician declined the booking request. Re-matching...';
          break;
      }
      this.timelineEvents.push({
        status: this.status,
        timestamp: new Date(),
        description: desc
      });
    }

    if (this.isModified('paymentStatus')) {
      let desc = `Payment status updated to ${this.paymentStatus}.`;
      if (this.paymentStatus === 'completed') {
        desc = `Payment of ₹${this.amount || 0} completed successfully via ${this.paymentMethod || 'cash'}.`;
      } else if (this.paymentStatus === 'cash_pending') {
        desc = 'Payment method selected: Cash. Awaiting technician confirmation.';
      }
      this.timelineEvents.push({
        status: `payment_${this.paymentStatus}`,
        timestamp: new Date(),
        description: desc
      });
    }
  }
  next();
});

bookingSchema.index({ userId: 1 });
bookingSchema.index({ providerId: 1 });
bookingSchema.index({ serviceId: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
