const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  guardianId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  relationship: { 
    type: String, 
    enum: ['Father', 'Mother', 'Guardian', 'Other'],
    required: true 
  },
  email: { type: String },
  phone: { type: String, required: true },
  alternatePhone: String,
  occupation: String,
  company: String,
  monthlyIncome: Number,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

parentSchema.index({ school: 1 });

module.exports = mongoose.model('Parent', parentSchema);
