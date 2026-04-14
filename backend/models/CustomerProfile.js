const mongoose = require('mongoose');

const customerProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  avatar: { type: String, default: '👤' },
  address: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('CustomerProfile', customerProfileSchema);
