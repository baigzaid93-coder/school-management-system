const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  slogan: String,
  logo: String,
  email: { type: String },
  phone: { type: String },
  mobile: { type: String },
  website: String,
  address: {
    street: String,
    city: { type: String, required: true },
    state: String,
    country: { type: String, default: 'Pakistan' },
    zipCode: String
  },
  registrationNumber: String,
  ntndumber: String,
  contactPerson: {
    name: String,
    designation: String,
    phone: String,
    email: String
  },
  modules: [{
    type: String,
    enum: [
      'student',
      'teacher', 
      'attendance',
      'exams',
      'grades',
      'fees',
      'expenses',
      'reports',
      'timetable',
      'subjects',
      'classes',
      'library',
      'transport',
      'hostel',
      'messages',
      'events',
      'documents'
    ]
  }],
  subscription: {
    plan: { type: String, enum: ['Free', 'Basic', 'Standard', 'Premium', 'Enterprise'], default: 'Free' },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    status: { type: String, enum: ['Active', 'Expired', 'Suspended', 'Trial'], default: 'Trial' },
    maxStudents: { type: Number, default: 50 },
    maxTeachers: { type: Number, default: 10 },
    price: { type: Number, default: 0 },
    billingCycle: { type: String, enum: ['Monthly', 'Quarterly', 'Yearly'], default: 'Monthly' }
  },
  settings: {
    timezone: { type: String, default: 'Asia/Karachi' },
    currency: { type: String, default: 'PKR' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    academicYearStart: { type: Number, default: 1 },
    workingDays: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
    schoolTiming: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '15:00' }
    }
  },
  branding: {
    primaryColor: { type: String, default: '#003366' },
    secondaryColor: { type: String, default: '#FF6600' }
  },
  feeStructure: {
    admissionFee: { type: Number, default: 5000 },
    securityFee: { type: Number, default: 2000 },
    monthlyTuitionFee: { type: Number, default: 3000 },
    transportFee: { type: Number, default: 0 },
    hostelFee: { type: Number, default: 0 },
    otherFee: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 }
  },
  documentNumbers: [{
    type: { type: String, required: true },
    prefix: { type: String, required: true },
    startNumber: { type: Number, default: 1 },
    currentNumber: { type: Number, default: 1 }
  }],
  declaration: {
    termsAndConditions: { type: String, default: '' },
    refundPolicy: { type: String, default: '' }
  },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  adminUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

schoolSchema.index({ 'address.city': 1 });
schoolSchema.index({ 'subscription.status': 1 });
schoolSchema.index({ 'subscription.plan': 1 });

module.exports = mongoose.model('School', schoolSchema);
