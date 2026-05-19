const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  categoryId: { type: String, required: true, enum: ['repair', 'installation', 'cleaning', 'other'] },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  description: { type: String, default: '' },
  // UI related fields
  color: { type: String, default: '' },
  bg: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
