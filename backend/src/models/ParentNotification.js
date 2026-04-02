const mongoose = require('mongoose');

const parentNotificationSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
  incident: { type: mongoose.Schema.Types.ObjectId, ref: 'DisciplineIncident' },
  warning: { type: mongoose.Schema.Types.ObjectId, ref: 'DisciplineWarning' },
  action: { type: mongoose.Schema.Types.ObjectId, ref: 'DisciplineAction' },
  notificationType: { 
    type: String, 
    enum: ['Discipline Incident', 'Warning Issued', 'Action Taken', 'Meeting Request', 'Appeal Response', 'General'],
    required: true 
  },
  channel: { 
    type: String, 
    enum: ['Phone', 'Email', 'SMS', 'Letter', 'Meeting', 'Portal', 'WhatsApp'],
    required: true 
  },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sentAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['Pending', 'Sent', 'Delivered', 'Read', 'Failed', 'No Response'],
    default: 'Sent'
  },
  deliveredAt: Date,
  readAt: Date,
  responseReceived: { type: Boolean, default: false },
  responseDate: Date,
  responseType: { 
    type: String, 
    enum: ['Acknowledged', 'Concerns Raised', 'Meeting Requested', 'Appeal Filed', 'No Response'],
    default: 'No Response'
  },
  responseNotes: String,
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  followUpRequired: { type: Boolean, default: false },
  followUpDate: Date,
  followUpCompleted: { type: Boolean, default: false },
  parentName: String,
  parentPhone: String,
  parentEmail: String,
  academicYear: String,
  term: String
}, { timestamps: true });

parentNotificationSchema.index({ school: 1, student: 1, sentAt: -1 });
parentNotificationSchema.index({ sentBy: 1, sentAt: -1 });
parentNotificationSchema.index({ status: 1 });

module.exports = mongoose.model('ParentNotification', parentNotificationSchema);
