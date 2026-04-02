const mongoose = require('mongoose');

const schoolSubscriptionSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, unique: true },
  plan: { 
    type: String, 
    enum: ['Free', 'Basic', 'Standard', 'Premium', 'Enterprise'],
    default: 'Free' 
  },
  billingCycle: { type: String, enum: ['Monthly', 'Quarterly', 'Yearly'], default: 'Monthly' },
  price: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  currentPeriodStart: { type: Date, default: Date.now },
  currentPeriodEnd: { type: Date },
  nextBillingDate: Date,
  status: { 
    type: String, 
    enum: ['Active', 'Expired', 'Suspended', 'Trial', 'Cancelled', 'Pending'],
    default: 'Trial' 
  },
  trialEndsAt: Date,
  limits: {
    maxStudents: { type: Number, default: 50 },
    maxTeachers: { type: Number, default: 10 },
    maxBranches: { type: Number, default: 1 }
  },
  features: [{
    type: String
  }],
  customFeatures: [{
    name: String,
    enabled: { type: Boolean, default: true }
  }],
  paymentInfo: {
    preferredMethod: { type: String, enum: ['Bank Transfer', 'JazzCash', 'EasyPaisa', 'Card', 'Cash'], default: 'Bank Transfer' },
    bankDetails: {
      accountTitle: String,
      accountNumber: String,
      bankName: String,
      branchCode: String
    },
    jazzCashNumber: String,
    easyPaisaNumber: String
  },
  billingHistory: [{
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    invoiceNumber: String,
    amount: Number,
    paidAt: Date,
    status: String
  }],
  autoRenew: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: Date,
  cancellationReason: String
}, { timestamps: true });

schoolSubscriptionSchema.index({ school: 1 }, { unique: true });
schoolSubscriptionSchema.index({ status: 1 });
schoolSubscriptionSchema.index({ nextBillingDate: 1 });

schoolSubscriptionSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('plan')) {
    const planLimits = {
      'Free': { maxStudents: 50, maxTeachers: 10, maxBranches: 1 },
      'Basic': { maxStudents: 200, maxTeachers: 30, maxBranches: 2 },
      'Standard': { maxStudents: 500, maxTeachers: 75, maxBranches: 5 },
      'Premium': { maxStudents: 1000, maxTeachers: 150, maxBranches: 10 },
      'Enterprise': { maxStudents: 10000, maxTeachers: 1000, maxBranches: 50 }
    };
    
    const planPrices = {
      'Free': 0,
      'Basic': 5000,
      'Standard': 10000,
      'Premium': 20000,
      'Enterprise': 50000
    };
    
    const planFeatures = {
      'Free': ['Basic Student Management', 'Basic Fee Management', 'Email Support'],
      'Basic': ['All Free Features', 'Attendance Tracking', 'Exam Management', 'Basic Reports', 'Priority Support'],
      'Standard': ['All Basic Features', 'Multi-branch Support', 'Transport Management', 'Custom Reports', 'SMS Notifications', 'Dedicated Support'],
      'Premium': ['All Standard Features', 'Parent Portal', 'Online Admissions', 'Payment Gateway', 'Advanced Analytics', 'API Access'],
      'Enterprise': ['All Premium Features', 'Unlimited Everything', 'White-label Option', 'Custom Integrations', '24/7 Priority Support', 'SLA Guarantee']
    };
    
    this.limits = planLimits[this.plan] || planLimits['Free'];
    this.price = planPrices[this.plan] || 0;
    this.features = planFeatures[this.plan] || planFeatures['Free'];
  }
  
  if (this.isNew) {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);
    this.trialEndsAt = trialEnd;
    this.status = 'Trial';
  }
  
  next();
});

module.exports = mongoose.model('SchoolSubscription', schoolSubscriptionSchema);
