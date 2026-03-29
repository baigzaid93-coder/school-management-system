const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    enum: ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT'],
    required: true 
  },
  entity: { type: String, required: true },
  entityId: mongoose.Schema.Types.ObjectId,
  module: { type: String, required: true },
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
