const mongoose = require('mongoose');

const approvalWorkflowSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['admission', 'leave', 'fee_concession', 'fee_waiver', 'expense', 'admin_action', 'custom'],
    required: true 
  },
  description: String,
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  levels: [{
    order: { type: Number, required: true },
    approverRole: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    approverRoleCode: { type: String },
    approverUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approverType: { type: String, enum: ['role', 'user', 'auto'] },
    autoApprove: { type: Boolean, default: false },
    condition: {
      field: String,
      operator: { type: String, enum: ['eq', 'gt', 'lt', 'gte', 'lte', 'in'] },
      value: mongoose.Schema.Types.Mixed
    },
    requiredPermission: String,
    maxAmount: Number,
    minAmount: Number
  }],
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  allowSelfApproval: { type: Boolean, default: false },
  allowOwnerApproval: { type: Boolean, default: false },
  notificationTemplate: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

approvalWorkflowSchema.index({ school: 1, type: 1, isActive: 1 });

module.exports = mongoose.model('ApprovalWorkflow', approvalWorkflowSchema);
