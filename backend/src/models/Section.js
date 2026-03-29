const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  classGrade: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassGrade', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  capacity: { type: Number, default: 40 },
  academicYear: String,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

sectionSchema.index({ school: 1 });
sectionSchema.index({ classGrade: 1, academicYear: 1, code: 1 });

module.exports = mongoose.model('Section', sectionSchema);
