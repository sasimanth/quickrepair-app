const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  providerId: {
    type: String,
    default: null,
    index: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  customerDetails: {
    name: String,
    phone: String,
    email: String,
    address: String,
    gstin: String
  },
  providerDetails: {
    name: String,
    phone: String,
    email: String,
    companyName: String
  },
  businessDetails: {
    legalName: { type: String, default: 'Fixvo Technologies' },
    tradeName: { type: String, default: 'Fixvo App' },
    address: { type: String, default: 'Madanapalle & Region, Andhra Pradesh, India' },
    phone: { type: String, default: '+91 95159 80170' },
    email: { type: String, default: 'fixvosupport@gmail.com' },
    gstin: { type: String, default: '' },
    sacCode: { type: String, default: '998719' }
  },
  itemizedCharges: [{
    description: String,
    category: String,
    amount: Number
  }],
  subTotal: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  taxableAmount: {
    type: Number,
    required: true
  },
  isGstApplicable: {
    type: Boolean,
    default: false
  },
  cgstRate: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstRate: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    default: 'completed'
  },
  transactionId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['issued', 'refunded', 'void'],
    default: 'issued'
  }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
