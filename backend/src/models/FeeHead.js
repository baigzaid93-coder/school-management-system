const mongoose = require('mongoose');

const feeHeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['Tuition', '固定', '一次性', 'Monthly', 'Termly', 'Annual'], default: '一次性' },
  amount: { type: Number, default: 0 },
  isCompulsory: { type: Boolean, default: true },
  applicableTo: [{ type: String, enum: ['All', 'New', 'Existing'] }],
  applicableClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ClassGrade' }],
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
  dueDays: { type: Number, default: 30 },
  isActive: { type: Boolean, default: true },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
}, { timestamps: true });

module.exports = mongoose.model('FeeHead', feeHeadSchema);
