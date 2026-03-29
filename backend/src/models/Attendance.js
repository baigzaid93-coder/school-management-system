const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  attendeeType: { 
    type: String, 
    enum: ['student', 'teacher'], 
    required: true 
  },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  classGrade: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassGrade' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Present', 'Absent', 'Late', 'Excused'],
    required: true 
  },
  remarks: String,
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Unique compound indexes to ensure one attendance record per person per day
attendanceSchema.index({ school: 1, student: 1, date: 1 }, { unique: true, sparse: true });
attendanceSchema.index({ school: 1, teacher: 1, date: 1 }, { unique: true, sparse: true });
attendanceSchema.index({ attendeeType: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
