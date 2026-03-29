const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

departmentSchema.index({ school: 1 });
departmentSchema.index({ code: 1, school: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
