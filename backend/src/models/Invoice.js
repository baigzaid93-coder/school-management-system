const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  subscription: {
    plan: { type: String, required: true },
    price: { type: Number, required: true },
    billingCycle: { type: String, default: 'Monthly' }
  },
  period: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    month: { type: String, required: true },
    year: { type: Number, required: true }
  },
  usage: {
    students: { type: Number, default: 0 },
    teachers: { type: Number, default: 0 },
    branches: { type: Number, default: 0 }
  },
  charges: {
    baseAmount: { type: Number, required: true },
    additionalStudentsCharge: { type: Number, default: 0 },
    additionalTeachersCharge: { type: Number, default: 0 },
    additionalBranchesCharge: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  status: { 
    type: String, 
    enum: ['Draft', 'Generated', 'Sent', 'Paid', 'Overdue', 'Cancelled', 'Void'],
    default: 'Generated' 
  },
  dueDate: { type: Date, required: true },
  paidDate: Date,
  paymentMethod: String,
  paymentReference: String,
  notes: String,
  generatedBy: { type: String, enum: ['Auto', 'Manual'], default: 'Auto' }
}, { timestamps: true });

invoiceSchema.index({ school: 1, 'period.month': 1, 'period.year': 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });

invoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    const year = new Date().getFullYear();
    const month = String(this.period.month).padStart(2, '0');
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
