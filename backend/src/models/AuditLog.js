const mongoose = require('mongoose');

const AUDIT_MODULES = ['STUDENT', 'TEACHER', 'USER', 'FEE', 'ATTENDANCE', 'EXAM', 'MARKS', 'GRADE', 'REPORT', 'COURSE', 'SUBJECT', 'TIMETABLE', 'LEAVE', 'ADMISSION', 'EXPENSE', 'INVOICE', 'ROLE', 'PERMISSION', 'SETTINGS', 'DISCIPLINE', 'APPROVAL', 'ADMIN', 'OTHER'];
const AUDIT_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT', 'SUBMIT', 'ACKNOWLEDGE'];

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    enum: AUDIT_ACTIONS,
    required: true 
  },
  entity: { type: String, required: true },
  entityId: mongoose.Schema.Types.ObjectId,
  module: { type: String, enum: AUDIT_MODULES, required: true },
  description: String,
  oldValues: mongoose.Schema.Types.Mixed,
  newValues: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  status: { type: String, enum: ['SUCCESS', 'FAILURE', 'PENDING'], default: 'SUCCESS' },
  errorMessage: String,
  metadata: mongoose.Schema.Types.Mixed,
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }
}, { timestamps: true });

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
