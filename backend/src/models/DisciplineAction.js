const mongoose = require('mongoose');

const disciplineActionSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  incident: { type: mongoose.Schema.Types.ObjectId, ref: 'DisciplineIncident' },
  warning: { type: mongoose.Schema.Types.ObjectId, ref: 'DisciplineWarning' },
  actionType: { 
    type: String, 
    enum: [
      'Verbal Warning',
      'Written Warning',
      'Detention',
      'Suspension',
      'Expulsion',
      'Community Service',
      'Counseling',
      'Parent Conference',
      'Behavior Contract',
      'Loss of Privileges',
      'In-School Suspension',
      'Out-School Suspension',
      'Restriction from Activities',
      'Academic Probation',
      'Other'
    ],
    required: true 
  },
  severity: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  description: { type: String, required: true },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  isActive: { type: Boolean, default: true },
  isCompleted: { type: Boolean, default: false },
  completedDate: Date,
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completionNotes: String,
  parentNotified: { type: Boolean, default: false },
  parentNotifiedDate: Date,
  conditions: [String],
  terms: String,
  followUpRequired: { type: Boolean, default: false },
  followUpDate: Date,
  followUpCompleted: { type: Boolean, default: false },
  followUpNotes: String,
  academicYear: String,
  term: String
}, { timestamps: true });

disciplineActionSchema.index({ school: 1, student: 1 });
disciplineActionSchema.index({ isActive: 1, endDate: 1 });
disciplineActionSchema.index({ issuedBy: 1, startDate: -1 });

module.exports = mongoose.model('DisciplineAction', disciplineActionSchema);
