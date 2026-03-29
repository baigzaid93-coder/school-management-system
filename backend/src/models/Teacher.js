const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  teacherId: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, default: Date.now },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  subjects: [{ type: String }],
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  assignedClass: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassGrade' },
  hireDate: { type: Date, default: Date.now },
  salary: { type: Number },
  status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
  qualifications: [String],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

teacherSchema.index({ school: 1 });
teacherSchema.index({ teacherId: 1, school: 1 }, { unique: true });

module.exports = mongoose.model('Teacher', teacherSchema);
