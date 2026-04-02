const mongoose = require('mongoose');

const disciplineWarningSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  incident: { type: mongoose.Schema.Types.ObjectId, ref: 'DisciplineIncident' },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  warningType: { 
    type: String, 
    enum: ['Verbal', 'Written', 'Final'],
    default: 'Written'
  },
  level: { type: Number, default: 1, min: 1, max: 3 },
  reason: { type: String, required: true },
  previousWarnings: { type: Number, default: 0 },
  effectiveDate: { type: Date, default: Date.now },
  expiryDate: Date,
  isActive: { type: Boolean, default: true },
  parentNotified: { type: Boolean, default: false },
  parentNotifiedDate: Date,
  parentNotifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedByParent: { type: Boolean, default: false },
  acknowledgedDate: Date,
  acknowledgementMethod: { 
    type: String, 
    enum: ['Phone', 'Email', 'Letter', 'Meeting', 'SMS', 'Portal'],
    default: 'Letter'
  },
  warningLetter: String,
  consequences: String,
  academicYear: String,
  term: String
}, { timestamps: true });

disciplineWarningSchema.index({ school: 1, student: 1, isActive: 1 });
disciplineWarningSchema.index({ issuedBy: 1, effectiveDate: -1 });

module.exports = mongoose.model('DisciplineWarning', disciplineWarningSchema);
