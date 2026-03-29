const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  term: { type: mongoose.Schema.Types.ObjectId, ref: 'Term' },
  classGrade: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassGrade', required: true },
  marksObtained: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
  weightage: { type: Number, default: 100 },
  isAbsent: { type: Boolean, default: false },
  isExempted: { type: Boolean, default: false },
  grade: String,
  remarks: String,
  checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  checkedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  approvedAt: Date,
  publishDate: Date
}, { timestamps: true });

markSchema.index({ exam: 1, student: 1, subject: 1 }, { unique: true });
markSchema.index({ student: 1, academicYear: 1, term: 1 });

markSchema.pre('save', function(next) {
  const percentage = (this.marksObtained / this.maxMarks) * 100;
  if (percentage >= 90) this.grade = 'A';
  else if (percentage >= 80) this.grade = 'B';
  else if (percentage >= 70) this.grade = 'C';
  else if (percentage >= 60) this.grade = 'D';
  else this.grade = 'F';
  next();
});

module.exports = mongoose.model('Mark', markSchema);
