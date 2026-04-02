const mongoose = require('mongoose');

const termSchema = new mongoose.Schema({
  name: { type: String, required: true },
  termNumber: { type: Number, required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isCurrent: { type: Boolean, default: false },
  status: { type: String, enum: ['Active', 'Upcoming', 'Completed'], default: 'Active' },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Term', termSchema);
