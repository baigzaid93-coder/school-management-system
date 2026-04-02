const Leave = require('../models/Leave');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const ApprovalRequest = require('../models/ApprovalRequest');
const User = require('../models/User');

exports.getAll = async (req, res) => {
  try {
    const { staff, status } = req.query;
    const query = { ...req.tenantQuery };
    if (staff) query.staff = staff;
    if (status) query.status = status;
    
    const leaves = await Leave.find(query)
      .populate('staff', 'firstName lastName staffId')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getByStaff = async (req, res) => {
  try {
    const leaves = await Leave.find({ staff: req.params.staffId }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const leave = new Leave(req.body);
    await leave.save();

    const workflow = await ApprovalWorkflow.findOne({
      school: req.body.school || req.tenantQuery?.school,
      type: 'leave',
      isActive: true,
      isDefault: true
    });

    if (workflow) {
      const user = await User.findById(req.user?.id || req.body.staff);
      const approvalRequest = new ApprovalRequest({
        workflow: workflow._id,
        school: req.body.school || req.tenantQuery?.school,
        type: 'leave',
        referenceId: leave._id,
        referenceModel: 'Leave',
        requester: req.user?.id || req.body.staff,
        requesterName: user?.firstName + ' ' + user?.lastName,
        data: {
          staffName: user?.firstName + ' ' + user?.lastName,
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          totalDays: leave.totalDays,
          reason: leave.reason
        },
        currentLevel: 1,
        totalLevels: workflow.levels.length || 1,
        status: 'pending',
        priority: 'normal',
        source: 'manual',
        history: [{
          level: 0,
          action: 'submit',
          actionBy: req.user?.id || req.body.staff,
          actionByName: user?.firstName + ' ' + user?.lastName,
          actionAt: new Date(),
          comments: 'Leave request submitted'
        }]
      });
      await approvalRequest.save();
      
      leave.approvalRequestId = approvalRequest._id;
      await leave.save();
    }

    res.status(201).json(leave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, comments } = req.body;
    
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    
    if (leave.approvalRequestId) {
      const ApprovalRequest = require('../models/ApprovalRequest');
      const approvalReq = await ApprovalRequest.findById(leave.approvalRequestId);
      if (approvalReq && approvalReq.status === 'pending') {
        const user = await User.findById(req.user?.id || approvedBy);
        approvalReq.history.push({
          level: approvalReq.currentLevel,
          action: 'approve',
          actionBy: req.user?.id || approvedBy,
          actionByName: user?.firstName + ' ' + user?.lastName,
          actionAt: new Date(),
          comments
        });
        approvalReq.status = 'approved';
        await approvalReq.save();
      }
    }
    
    leave.status = 'Approved';
    leave.approvedBy = approvedBy || req.user?.id;
    leave.approvedOn = new Date();
    await leave.save();
    
    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, reason } = req.body;
    
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    
    if (leave.approvalRequestId) {
      const ApprovalRequest = require('../models/ApprovalRequest');
      const approvalReq = await ApprovalRequest.findById(leave.approvalRequestId);
      if (approvalReq && approvalReq.status === 'pending') {
        const user = await User.findById(req.user?.id || approvedBy);
        approvalReq.history.push({
          level: approvalReq.currentLevel,
          action: 'reject',
          actionBy: req.user?.id || approvedBy,
          actionByName: user?.firstName + ' ' + user?.lastName,
          actionAt: new Date(),
          comments: reason
        });
        approvalReq.status = 'rejected';
        approvalReq.rejectionReason = reason;
        await approvalReq.save();
      }
    }
    
    leave.status = 'Rejected';
    leave.approvedBy = approvedBy || req.user?.id;
    leave.approvedOn = new Date();
    leave.rejectionReason = reason;
    await leave.save();
    
    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    );
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
