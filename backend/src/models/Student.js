const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  firstName: { type: String, default: 'Student' },
  lastName: { type: String, default: 'Student' },
  dateOfBirth: { type: Date, default: Date.now },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  email: { type: String },
  phone: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  classGrade: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassGrade' },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  admissionDate: { type: Date, default: Date.now },
  admissionStatus: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: String,
  approvalRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalRequest' },
  status: { type: String, enum: ['Active', 'Inactive', 'Graduated', 'Suspended'], default: 'Active' },
  parentName: String,
  parentPhone: String,
  parentEmail: String,
  familyNumber: { type: String },
  photo: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Fee' }],
  admissionForm: {
    fullNameUrdu: String,
    placeOfBirth: String,
    nationality: String,
    religion: String,
    bloodGroup: String,
    birthCertNo: String,
    photo: String,
    father: {
      fullName: String,
      cnic: String,
      qualification: String,
      occupation: String,
      organization: String,
      monthlyIncome: String,
      mobile: String,
      whatsapp: String,
      email: String
    },
    mother: {
      fullName: String,
      cnic: String,
      qualification: String,
      occupation: String,
      mobile: String,
      email: String
    },
    guardian: {
      fullName: String,
      relation: String,
      cnic: String,
      mobile: String,
      address: String
    },
    currentAddress: {
      houseNo: String,
      area: String,
      city: String,
      postalCode: String
    },
    permanentAddress: {
      houseNo: String,
      area: String,
      city: String,
      postalCode: String
    },
    sameAddress: { type: Boolean, default: true },
    academic: {
      previousSchool: String,
      previousClass: String,
      lastResult: String,
      reasonForLeaving: String,
      leavingCertificate: Boolean
    },
    medical: {
      diseaseAllergy: String,
      physicalDisability: String,
      emergencyNotes: String,
      doctorName: String,
      emergencyContact: String
    },
    transport: {
      required: Boolean,
      pickUpAddress: String,
      dropOffAddress: String,
      routeArea: String
    },
    hostel: {
      required: Boolean,
      guardianName: String,
      guardianContact: String
    },
    sibling: {
      hasSibling: Boolean,
      siblings: [{ name: String, classGrade: String }]
    },
    fee: {
      admissionFee: String,
      securityFee: String,
      monthlyTuitionFee: String,
      transportFee: String,
      hostelFee: String,
      otherFee: String,
      discount: String,
      remarks: String
    },
    documents: {
      birthCertificate: Boolean,
      fatherCnic: Boolean,
      motherCnic: Boolean,
      guardianCnic: Boolean,
      photos: Boolean,
      previousResult: Boolean,
      leavingCertificate: Boolean,
      medicalCertificate: Boolean,
      other: String
    },
    declaration: {
      parentName: String,
      signature: Boolean,
      date: Date
    },
    session: String
  }
}, { timestamps: true });

studentSchema.index({ school: 1 });
studentSchema.index({ classGrade: 1 });
studentSchema.index({ studentId: 1, school: 1 }, { unique: true });
studentSchema.index({ familyNumber: 1, school: 1 });

module.exports = mongoose.model('Student', studentSchema);
