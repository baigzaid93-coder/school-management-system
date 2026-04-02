const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema({
  workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalWorkflow' },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  type: { 
    type: String, 
    enum: ['admission', 'leave', 'fee_concession', 'fee_waiver', 'expense', 'admin_action', 'custom'],
    required: true 
  },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  referenceModel: { type: String },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requesterName: String,
  data: { type: mongoose.Schema.Types.Mixed },
  currentLevel: { type: Number, default: 1 },
  totalLevels: { type: Number, default: 1 },
  currentLevelConfig: {
    approverRole: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    approverRoleCode: String,
    approverUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requiredPermission: String,
    maxAmount: Number
  },
  eligibleApprovers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    roleCode: String
  }],
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'escalated'],
    default: 'pending'
  },
  history: [{
    level: Number,
    action: { type: String, enum: ['submit', 'approve', 'reject', 'escalate', 'cancel'] },
    actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actionByName: String,
    actionByRole: String,
    actionAt: { type: Date, default: Date.now },
    comments: String,
    previousData: mongoose.Schema.Types.Mixed,
    newData: mongoose.Schema.Types.Mixed
  }],
  dueDate: Date,
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  source: { type: String, enum: ['system', 'manual', 'automated'] },
  cancellationReason: String,
  rejectionReason: String,
  amount: Number
}, { timestamps: true });

approvalRequestSchema.index({ school: 1, status: 1 });
approvalRequestSchema.index({ requester: 1, status: 1 });
approvalRequestSchema.index({ type: 1, status: 1 });
approvalRequestSchema.index({ dueDate: 1 });

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
