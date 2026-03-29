const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
  term: { type: mongoose.Schema.Types.ObjectId, ref: 'Term' },
  classGrade: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassGrade', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  dayOfWeek: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true 
  },
  periods: [{
    periodNumber: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    room: String,
    isBreak: { type: Boolean, default: false }
  }],
  effectiveFrom: { type: Date },
  effectiveTo: Date,
  status: { type: String, enum: ['Draft', 'Active', 'Archived'], default: 'Draft' },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
}, { timestamps: true });

timetableSchema.index({ classGrade: 1, section: 1, dayOfWeek: 1 });
timetableSchema.index({ school: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
