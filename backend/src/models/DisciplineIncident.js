const mongoose = require('mongoose');

const disciplineIncidentSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  incidentDate: { type: Date, required: true, default: Date.now },
  incidentType: { 
    type: String, 
    enum: [
      'Verbal Abuse', 
      'Physical Fight', 
      'Bullying', 
      'Harassment',
      'Theft',
      'Vandalism',
      'Cheating',
      'Truancy',
      'Late Arrival',
      'Dress Code',
      'Mobile Phone',
      'Disobedience',
      'Substance Abuse',
      'Weapon',
      'Other'
    ],
    required: true 
  },
  severity: { 
    type: String, 
    enum: ['Minor', 'Moderate', 'Serious', 'Severe'],
    default: 'Minor'
  },
  description: { type: String, required: true },
  location: String,
  witnesses: [{ type: String }],
  evidence: [{
    type: { type: String },
    url: String,
    description: String
  }],
  status: { 
    type: String, 
    enum: ['Reported', 'Under Investigation', 'Resolved', 'Escalated', 'Closed'],
    default: 'Reported'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolution: String,
  resolvedDate: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  incidentNumber: { type: String },
  academicYear: String,
  term: String
}, { timestamps: true });

disciplineIncidentSchema.index({ school: 1, incidentDate: -1 });
disciplineIncidentSchema.index({ student: 1, incidentDate: -1 });
disciplineIncidentSchema.index({ status: 1 });

disciplineIncidentSchema.pre('save', async function(next) {
  if (this.isNew && !this.incidentNumber) {
    const count = await mongoose.model('DisciplineIncident').countDocuments({ school: this.school });
    this.incidentNumber = `INC-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('DisciplineIncident', disciplineIncidentSchema);
