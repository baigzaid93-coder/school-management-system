const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  staffId: { type: String },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  designation: { type: String },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffRole' },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number
  }],
  experience: [{
    organization: String,
    position: String,
    startDate: Date,
    endDate: Date
  }],
  salary: {
    basic: Number,
    allowances: Number,
    deductions: Number
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    branch: String
  },
  dateOfJoining: { type: Date, default: Date.now },
  dateOfLeaving: Date,
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Active', 'Inactive', 'On Leave', 'Terminated'], default: 'Active' }
}, { timestamps: true });

staffSchema.index({ school: 1 });
staffSchema.index({ staffId: 1, school: 1 }, { unique: true });

module.exports = mongoose.model('Staff', staffSchema);
