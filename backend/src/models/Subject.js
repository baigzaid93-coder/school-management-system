const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  type: { type: String, enum: ['Theory', 'Practical', 'Both'], default: 'Theory' },
  classGrades: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ClassGrade' }],
  description: String,
  isCompulsory: { type: Boolean, default: false },
  hasLab: { type: Boolean, default: false },
  labHoursPerWeek: { type: Number, default: 0 },
  theoryHoursPerWeek: { type: Number, default: 0 },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

subjectSchema.index({ school: 1 });
subjectSchema.index({ code: 1, school: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
