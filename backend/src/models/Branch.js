const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  phone: String,
  email: String,
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  isMain: { type: Boolean, default: false },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

branchSchema.index({ school: 1 });
branchSchema.index({ school: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Branch', branchSchema);
