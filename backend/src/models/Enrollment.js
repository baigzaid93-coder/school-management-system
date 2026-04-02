const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  classGrade: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassGrade', required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  rollNumber: String,
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  enrollmentDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['Active', 'Promoted', 'Completed', 'Transferred', 'Dropped'],
    default: 'Active'
  },
  previousClass: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassGrade' },
  transferFrom: String,
  transferTo: String,
  remarks: String,
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
}, { timestamps: true });

enrollmentSchema.index({ student: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
