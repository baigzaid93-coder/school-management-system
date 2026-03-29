const mongoose = require('mongoose');

const schoolProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  tagline: String,
  logo: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  phone: String,
  email: String,
  website: String,
  registrationNumber: String,
  foundedYear: Number,
  principleName: String,
  principleSignature: String,
  borderColor: { type: String, default: '#1e40af' },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
  currentTerm: { type: mongoose.Schema.Types.ObjectId, ref: 'Term' }
}, { timestamps: true });

module.exports = mongoose.model('SchoolProfile', schoolProfileSchema);
