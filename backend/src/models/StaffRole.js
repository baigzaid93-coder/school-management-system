const mongoose = require('mongoose');

const staffRoleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: String,
  permissions: [String],
  isTeaching: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('StaffRole', staffRoleSchema);
