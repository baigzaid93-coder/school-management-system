const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isCurrent: { type: Boolean, default: false },
  status: { type: String, enum: ['Active', 'Upcoming', 'Completed'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('AcademicYear', academicYearSchema);
