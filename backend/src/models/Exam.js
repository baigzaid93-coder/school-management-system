const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  examId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  examType: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamType', required: true },
  classGrade: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassGrade', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  term: { type: mongoose.Schema.Types.ObjectId, ref: 'Term' },
  subjects: [{ 
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    date: Date,
    startTime: String,
    endTime: String,
    venue: String,
    maxMarks: Number
  }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  gradingSystem: mongoose.Schema.Types.Mixed,
  status: { 
    type: String, 
    enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  publishResults: { type: Boolean, default: false },
  remarks: String
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
