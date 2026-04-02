const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, enum: ['Free', 'Basic', 'Standard', 'Premium', 'Enterprise'] },
  price: { type: Number, required: true },
  billingCycle: { type: String, enum: ['Monthly', 'Quarterly', 'Yearly'], default: 'Monthly' },
  maxStudents: { type: Number, required: true },
  maxTeachers: { type: Number, required: true },
  maxBranches: { type: Number, required: true },
  features: [{
    type: String
  }],
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

subscriptionPlanSchema.statics.getDefaultPlans = function() {
  return [
    {
      name: 'Free',
      price: 0,
      billingCycle: 'Monthly',
      maxStudents: 50,
      maxTeachers: 10,
      maxBranches: 1,
      features: ['Basic Student Management', 'Basic Fee Management', 'Email Support'],
      isActive: true,
      order: 1
    },
    {
      name: 'Basic',
      price: 5000,
      billingCycle: 'Monthly',
      maxStudents: 200,
      maxTeachers: 30,
      maxBranches: 2,
      features: ['All Free Features', 'Attendance Tracking', 'Exam Management', 'Basic Reports', 'Priority Support'],
      isActive: true,
      order: 2
    },
    {
      name: 'Standard',
      price: 10000,
      billingCycle: 'Monthly',
      maxStudents: 500,
      maxTeachers: 75,
      maxBranches: 5,
      features: ['All Basic Features', 'Multi-branch Support', 'Transport Management', 'Custom Reports', 'SMS Notifications', 'Dedicated Support'],
      isActive: true,
      order: 3
    },
    {
      name: 'Premium',
      price: 20000,
      billingCycle: 'Monthly',
      maxStudents: 1000,
      maxTeachers: 150,
      maxBranches: 10,
      features: ['All Standard Features', 'Parent Portal', 'Online Admissions', 'Payment Gateway', 'Advanced Analytics', 'API Access'],
      isActive: true,
      order: 4
    },
    {
      name: 'Enterprise',
      price: 50000,
      billingCycle: 'Monthly',
      maxStudents: 10000,
      maxTeachers: 1000,
      maxBranches: 50,
      features: ['All Premium Features', 'Unlimited Everything', 'White-label Option', 'Custom Integrations', '24/7 Priority Support', 'SLA Guarantee'],
      isActive: true,
      order: 5
    }
  ];
};

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
