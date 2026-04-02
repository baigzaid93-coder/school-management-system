const mongoose = require('mongoose');

const examTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['Continuous', 'Summative', 'Both'], default: 'Both' },
  weightage: { type: Number, default: 0 },
  maxScore: { type: Number, default: 100 },
  passingScore: { type: Number, default: 40 },
  isTermExam: { type: Boolean, default: false },
  term: { type: mongoose.Schema.Types.ObjectId, ref: 'Term' },
  isActive: { type: Boolean, default: true },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
}, { timestamps: true });

module.exports = mongoose.model('ExamType', examTypeSchema);
