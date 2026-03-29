const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  assessmentType: { 
    type: String, 
    enum: ['Quiz', 'Test', 'Midterm', 'Final', 'Assignment', 'Project', 'Participation'],
    required: true 
  },
  score: { type: Number, required: true, min: 0, max: 100 },
  maxScore: { type: Number, default: 100 },
  weight: { type: Number, default: 1 },
  date: { type: Date, default: Date.now },
  remarks: String,
  term: { type: String, enum: ['Term 1', 'Term 2', 'Term 3', 'Final'] },
  academicYear: String
}, { timestamps: true });

module.exports = mongoose.model('Grade', gradeSchema);
