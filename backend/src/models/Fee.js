const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  classGrade: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassGrade' },
  voucherNumber: { type: String },
  feeType: { 
    type: String, 
    enum: ['Tuition', 'Registration', 'Library', 'Laboratory', 'Activity', 'Transportation', 'Exam', 'Fine', 'Family', 'Other'],
    required: true 
  },
  fineType: {
    type: String,
    enum: ['Late Payment', 'Library Fine', 'Damage', 'Lost Book', 'Misconduct', 'Other'],
  },
  familyNumber: { type: String },
  familyMembers: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentName: String,
    studentCode: String,
    className: String,
    feeAmount: Number
  }],
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueDate: { type: Date, required: true },
  paidDate: Date,
  status: { 
    type: String, 
    enum: ['Pending', 'Partial', 'Paid', 'Overdue'],
    default: 'Pending' 
  },
  academicYear: String,
  term: String,
  description: String,
  payments: [{
    amount: Number,
    date: Date,
    method: { type: String, enum: ['Cash', 'Card', 'Bank Transfer', 'Online'] },
    reference: String
  }]
}, { timestamps: true });

feeSchema.index({ school: 1 });
feeSchema.index({ student: 1 });
feeSchema.index({ familyNumber: 1 });

module.exports = mongoose.model('Fee', feeSchema);
