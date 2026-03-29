const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  inquiryId: { type: String, unique: true },
  registrationNumber: { type: String, unique: true },
  
  inquiry: {
    inquiryNo: { type: String },
    date: { type: Date, default: Date.now },
    sessionAppliedFor: String,
    classAppliedFor: String,
    status: { 
      type: String, 
      enum: ['new', 'follow-up', 'converted', 'closed'], 
      default: 'new' 
    },
    followUpDate: Date,
    followUpTime: String,
    followUpRemarks: String,
    inquiryTakenBy: String,
    counselorName: String,
    admissionTestDate: Date,
    interviewDate: Date,
    finalStatus: { 
      type: String, 
      enum: ['pending', 'interested', 'not-interested', 'in-process', 'admitted', 'rejected'],
      default: 'pending'
    },
    remarks: String
  },
  
  student: {
    fullName: String,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: Date,
    age: String,
    birthCertNo: String,
    nationality: { type: String, default: 'Pakistani' },
    religion: String,
    previousSchool: String,
    currentClass: String,
    lastExamPercentage: String,
    specialNeeds: String
  },
  
  father: {
    fullName: String,
    cnic: String,
    occupation: String,
    organization: String,
    mobile: String,
    whatsapp: String,
    email: String
  },
  
  mother: {
    fullName: String,
    cnic: String,
    occupation: String,
    organization: String,
    mobile: String,
    whatsapp: String,
    email: String
  },
  
  primaryContact: {
    name: String,
    relation: String,
    preferredNo: String,
    preferredMethod: { type: String, enum: ['call', 'whatsapp', 'email'], default: 'call' }
  },
  
  address: {
    city: String,
    area: String,
    postalCode: String
  },
  
  source: {
    type: String,
    referrerName: String,
    referrerContact: String
  },
  
  academic: {
    desiredClass: String,
    desiredStartDate: Date,
    campus: String,
    shift: { type: String, enum: ['morning', 'evening'], default: 'morning' },
    transportRequired: { type: Boolean, default: false },
    hostelRequired: { type: Boolean, default: false },
    booksUniformInfo: { type: Boolean, default: false }
  },
  
  siblings: {
    hasSibling: { type: Boolean, default: false },
    siblings: [{
      name: String,
      classGrade: String
    }]
  },
  
  discussion: {
    parentQuery: String,
    infoProvided: {
      feeStructure: { type: Boolean, default: false },
      admissionProcess: { type: Boolean, default: false },
      testInterviewDetails: { type: Boolean, default: false },
      prospectus: { type: Boolean, default: false },
      campusTour: { type: Boolean, default: false },
      transportDetails: { type: Boolean, default: false },
      other: String
    }
  },
  
  documents: {
    birthCertificate: { type: Boolean, default: false },
    parentCnic: { type: Boolean, default: false },
    previousResult: { type: Boolean, default: false },
    leavingCertificate: { type: Boolean, default: false },
    photographs: { type: Boolean, default: false },
    other: String
  },
  
  declaration: {
    parentSignature: { type: Boolean, default: false },
    date: Date
  },
  
  applicationStatus: {
    type: String,
    enum: [
      'inquiry', 
      'application-submitted', 
      'documents-pending', 
      'documents-verified',
      'test-pending',
      'test-completed',
      'interview-pending',
      'interview-completed',
      'principal-pending',
      'principal-approved',
      'principal-rejected',
      'accounts-pending',
      'accounts-approved',
      'accounts-rejected',
      'approved',
      'rejected',
      'enrolled',
      'cancelled'
    ],
    default: 'inquiry'
  },
  
  principalApproval: {
    approved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    remarks: String
  },
  
  accountsApproval: {
    approved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    remarks: String,
    feesAssigned: { type: Boolean, default: false }
  },
  
  studentRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

admissionSchema.index({ 'inquiry.inquiryNo': 1 });
admissionSchema.index({ 'inquiry.status': 1 });
admissionSchema.index({ 'student.fullName': 'text', 'father.mobile': 'text', 'father.email': 'text' });

admissionSchema.pre('save', async function(next) {
  if (this.isNew && !this.inquiryId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments();
    this.inquiryId = `INQ-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    
    if (!this.inquiry) {
      this.inquiry = {};
    }
    this.inquiry.inquiryNo = this.inquiryId;
  }
  next();
});

admissionSchema.methods.generateRegistrationNumber = async function() {
  if (!this.registrationNumber) {
    const year = new Date().getFullYear();
    const classCode = this.academic?.desiredClass?.substring(0, 2).toUpperCase() || 'NR';
    const count = await this.constructor.countDocuments({ registrationNumber: { $exists: true } });
    this.registrationNumber = `REG-${year}-${classCode}-${String(count + 1).padStart(4, '0')}`;
    await this.save();
  }
  return this.registrationNumber;
};

module.exports = mongoose.model('Admission', admissionSchema);
