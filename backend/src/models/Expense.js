const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  voucherNumber: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['General', 'Salary', 'Advance Salary', 'Deduction', 'Utilities', 'Supplies', 'Maintenance', 'Transport', 'Other'],
    required: true 
  },
  deductionType: {
    type: String,
    enum: ['Late Arrival', 'Absence', 'Loan Recovery', 'Other Deduction'],
  },
  date: { type: Date, required: true },
  vendor: String,
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Deduction', 'Other'],
    default: 'Cash'
  },
  reference: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  recipients: [{
    type: { type: String, enum: ['teacher', 'staff'] },
    person: { type: mongoose.Schema.Types.ObjectId }
  }],
  notes: String,
  attachments: [String]
}, { timestamps: true });

expenseSchema.index({ school: 1 });
expenseSchema.index({ date: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ voucherNumber: 1, school: 1 }, { unique: true });

module.exports = mongoose.model('Expense', expenseSchema);
