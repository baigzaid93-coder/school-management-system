const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  leaveType: { 
    type: String, 
    enum: ['Sick', 'Casual', 'Earned', 'Maternity', 'Paternity', 'Unpaid', 'Emergency'],
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  appliedOn: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedOn: Date,
  rejectionReason: String,
  approvalRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalRequest' },
  documents: [{
    name: String,
    url: String
  }],
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }
}, { timestamps: true });

leaveSchema.index({ staff: 1, startDate: -1 });

module.exports = mongoose.model('Leave', leaveSchema);
