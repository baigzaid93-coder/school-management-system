const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  description: String,
  credits: { type: Number, default: 3 },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  schedule: {
    dayOfWeek: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
    startTime: String,
    endTime: String,
    room: String
  },
  semester: { type: String, enum: ['Fall', 'Spring', 'Summer', 'Winter'] },
  academicYear: String,
  maxStudents: { type: Number, default: 30 },
  status: { type: String, enum: ['Active', 'Inactive', 'Completed'], default: 'Active' },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
