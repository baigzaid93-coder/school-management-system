const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const ApprovalRequest = require('../models/ApprovalRequest');
const AuditLog = require('../models/AuditLog');
const Student = require('../models/Student');
const Leave = require('../models/Leave');
const Fee = require('../models/Fee');
const User = require('../models/User');
const Role = require('../models/Role');

const typePermissions = {
  admission: 'admission:approve',
  leave: 'leave:approve',
  fee_concession: 'fee:approve',
  fee_waiver: 'fee:approve',
  expense: 'expense:approve',
  admin_action: 'admin:approve'
};

const typeLabels = {
  admission: 'Student Admission',
  leave: 'Leave Request',
  fee_concession: 'Fee Concession',
  fee_waiver: 'Fee Waiver',
  expense: 'Expense',
  admin_action: 'Admin Action',
  custom: 'Custom Request'
};

const checkApproverPermission = async (user, request, workflow) => {
  if (user.isSuperAdmin) return { allowed: true, reason: 'Super Admin' };
  
  const currentLevel = workflow.levels.find(l => l.order === request.currentLevel);
  if (!currentLevel) return { allowed: false, reason: 'No approval level configured' };
  
  if (currentLevel.requiredPermission && user.role?.permissions) {
    const hasPermission = user.role.permissions.includes('*') || 
                          user.role.permissions.includes(currentLevel.requiredPermission);
    if (!hasPermission) {
      return { allowed: false, reason: `Missing permission: ${currentLevel.requiredPermission}` };
    }
  }
  
  if (currentLevel.approverRoleCode) {
    const role = await Role.findById(user.role?._id || user.role);
    if (role && role.code !== currentLevel.approverRoleCode) {
      if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN'].includes(role.code)) {
        return { allowed: false, reason: `Only ${currentLevel.approverRoleCode} can approve at this level` };
      }
    }
  }
  
  if (currentLevel.approverUser && currentLevel.approverUser.toString() !== user._id.toString()) {
    return { allowed: false, reason: 'Not assigned as approver for this request' };
  }
  
  if (!workflow.allowSelfApproval && request.requester.toString() === user._id.toString()) {
    return { allowed: false, reason: 'Cannot approve your own request' };
  }
  
  if (currentLevel.maxAmount && request.amount > currentLevel.maxAmount) {
    return { allowed: false, reason: `Amount exceeds limit of ${currentLevel.maxAmount}` };
  }
  
  return { allowed: true, reason: 'Approved' };
};

const getEligibleApprovers = async (workflow, request) => {
  const eligible = [];
  const currentLevel = workflow.levels.find(l => l.order === request.currentLevel);
  
  if (!currentLevel) return eligible;
  
  if (currentLevel.approverType === 'role' && currentLevel.approverRole) {
    const approverRole = await Role.findById(currentLevel.approverRole);
    if (approverRole) {
      const users = await User.find({ 
        school: workflow.school,
        role: approverRole._id,
        isActive: true
      }).select('_id firstName lastName');
      users.forEach(u => eligible.push({
        user: u._id,
        role: approverRole._id,
        roleCode: approverRole.code
      }));
    }
  }
  
  if (currentLevel.approverType === 'role' && currentLevel.approverRoleCode) {
    const approverRole = await Role.findOne({ code: currentLevel.approverRoleCode });
    if (approverRole) {
      const users = await User.find({ 
        school: workflow.school,
        role: approverRole._id,
        isActive: true
      }).select('_id firstName lastName');
      users.forEach(u => eligible.push({
        user: u._id,
        role: approverRole._id,
        roleCode: approverRole.code
      }));
    }
  }
  
  if (currentLevel.approverType === 'user' && currentLevel.approverUser) {
    const approverUser = await User.findById(currentLevel.approverUser);
    if (approverUser) {
      eligible.push({
        user: approverUser._id,
        role: approverUser.role,
        roleCode: approverUser.role?.code
      });
    }
  }
  
  return eligible;
};

const getWorkflows = async (req, res) => {
  try {
    const workflows = await ApprovalWorkflow.find({ 
      school: req.tenantQuery.school 
    })
    .populate('createdBy', 'name email')
    .populate('levels.approverRole', 'name code')
    .populate('levels.approverUser', 'firstName lastName');
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createWorkflow = async (req, res) => {
  try {
    const workflow = new ApprovalWorkflow({
      ...req.body,
      school: req.tenantQuery.school,
      createdBy: req.user.id
    });
    await workflow.save();
    
    await workflow.populate('levels.approverRole', 'name code');
    await workflow.populate('levels.approverUser', 'firstName lastName');
    
    res.status(201).json(workflow);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateWorkflow = async (req, res) => {
  try {
    const workflow = await ApprovalWorkflow.findOneAndUpdate(
      { _id: req.params.id, school: req.tenantQuery.school },
      req.body,
      { new: true }
    )
    .populate('levels.approverRole', 'name code')
    .populate('levels.approverUser', 'firstName lastName');
    
    if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
    res.json(workflow);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteWorkflow = async (req, res) => {
  try {
    const workflow = await ApprovalWorkflow.findOneAndUpdate(
      { _id: req.params.id, school: req.tenantQuery.school },
      { isActive: false },
      { new: true }
    );
    if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
    res.json({ message: 'Workflow deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPendingApprovals = async (req, res) => {
  try {
    const { type, myPending, all, canApprove } = req.query;
    const user = await User.findById(req.user.id).populate('role');
    const userRole = user.role;
    const isAdmin = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN'].includes(userRole?.code);

    let filter = { school: req.tenantQuery.school };
    if (type) filter.type = type;
    if (!all) filter.status = 'pending';

    let requests = await ApprovalRequest.find(filter)
      .populate('requester', 'firstName lastName email')
      .populate('workflow', 'name levels')
      .populate('history.actionBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    if (canApprove === 'true' && !isAdmin) {
      const filteredRequests = [];
      for (const request of requests) {
        const workflow = await ApprovalWorkflow.findById(request.workflow);
        if (workflow) {
          const permission = await checkApproverPermission(user, request, workflow);
          if (permission.allowed) {
            filteredRequests.push(request);
          }
        }
      }
      requests = filteredRequests;
    }

    const result = requests.map(r => ({
      ...r.toObject(),
      canApprove: isAdmin ? true : false,
      typeLabel: typeLabels[r.type] || r.type
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyPendingApprovals = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role');
    const userRole = user.role;
    const isAdmin = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN'].includes(userRole?.code);

    const filter = { school: req.tenantQuery.school, status: 'pending' };
    let requests = await ApprovalRequest.find(filter)
      .populate('requester', 'firstName lastName email')
      .populate('workflow', 'name levels')
      .sort({ createdAt: -1 });

    const filteredRequests = [];
    for (const request of requests) {
      const workflow = await ApprovalWorkflow.findById(request.workflow);
      if (workflow) {
        const permission = await checkApproverPermission(user, request, workflow);
        if (permission.allowed) {
          filteredRequests.push({
            ...request.toObject(),
            canApprove: true,
            typeLabel: typeLabels[request.type] || request.type
          });
        }
      }
    }

    res.json(filteredRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getApprovalById = async (req, res) => {
  try {
    const request = await ApprovalRequest.findOne({
      _id: req.params.id,
      school: req.tenantQuery.school
    })
    .populate('requester', 'firstName lastName email')
    .populate('history.actionBy', 'firstName lastName role')
    .populate('workflow')
    .populate('eligibleApprovers.user', 'firstName lastName')
    .populate('eligibleApprovers.role', 'name code');

    if (!request) return res.status(404).json({ message: 'Approval request not found' });

    const user = await User.findById(req.user.id).populate('role');
    const workflow = await ApprovalWorkflow.findById(request.workflow);
    let canApprove = false;
    let permissionCheck = { allowed: false, reason: '' };

    if (request.status === 'pending') {
      if (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN'].includes(user.role?.code)) {
        canApprove = true;
      } else if (workflow) {
        permissionCheck = await checkApproverPermission(user, request, workflow);
        canApprove = permissionCheck.allowed;
      }
    }

    res.json({
      ...request.toObject(),
      canApprove,
      permissionReason: permissionCheck.reason,
      typeLabel: typeLabels[request.type] || request.type
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitForApproval = async (req, res) => {
  try {
    const { type, referenceId, referenceModel, data, priority, source, amount } = req.body;

    let workflow = await ApprovalWorkflow.findOne({
      school: req.tenantQuery.school,
      type,
      isActive: true,
      isDefault: true
    });

    if (!workflow) {
      workflow = await ApprovalWorkflow.findOne({
        school: req.tenantQuery.school,
        type,
        isActive: true
      });
    }

    if (!workflow) {
      return res.status(400).json({ message: 'No approval workflow configured for this type' });
    }

    const user = await User.findById(req.user.id).populate('role');
    const currentLevel = workflow.levels.find(l => l.order === 1);
    const eligibleApprovers = await getEligibleApprovers(workflow, { currentLevel: 1, requester: user._id, amount });

    const approvalRequest = new ApprovalRequest({
      workflow: workflow._id,
      school: req.tenantQuery.school,
      type,
      referenceId,
      referenceModel,
      requester: req.user.id,
      requesterName: `${user.firstName} ${user.lastName}`,
      data,
      currentLevel: 1,
      totalLevels: workflow.levels.length || 1,
      currentLevelConfig: currentLevel ? {
        approverRole: currentLevel.approverRole,
        approverRoleCode: currentLevel.approverRoleCode,
        approverUser: currentLevel.approverUser,
        requiredPermission: currentLevel.requiredPermission,
        maxAmount: currentLevel.maxAmount
      } : undefined,
      eligibleApprovers,
      status: 'pending',
      priority: priority || 'normal',
      source: source || 'manual',
      amount: amount || data?.amount || 0,
      history: [{
        level: 0,
        action: 'submit',
        actionBy: req.user.id,
        actionByName: `${user.firstName} ${user.lastName}`,
        actionByRole: user.role?.name,
        actionAt: new Date(),
        comments: req.body.comments || 'Submitted for approval'
      }]
    });

    await approvalRequest.save();

    await AuditLog.create({
      school: req.tenantQuery.school,
      user: req.user.id,
      action: 'SUBMIT',
      module: 'APPROVAL',
      entity: 'ApprovalRequest',
      entityId: approvalRequest._id,
      newValues: { type, referenceId, priority }
    });

    await approvalRequest.populate('workflow', 'name');
    
    res.status(201).json({
      ...approvalRequest.toObject(),
      typeLabel: typeLabels[type]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, data } = req.body;

    const request = await ApprovalRequest.findOne({
      _id: id,
      school: req.tenantQuery.school,
      status: 'pending'
    }).populate('workflow');

    if (!request) return res.status(404).json({ message: 'Approval request not found or already processed' });

    const user = await User.findById(req.user.id).populate('role');
    const workflow = await ApprovalWorkflow.findById(request.workflow);

    if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN'].includes(user.role?.code)) {
      if (workflow) {
        const permission = await checkApproverPermission(user, request, workflow);
        if (!permission.allowed) {
          return res.status(403).json({ message: permission.reason });
        }
      }
    }

    const isLastLevel = request.currentLevel >= request.totalLevels;

    request.history.push({
      level: request.currentLevel,
      action: 'approve',
      actionBy: req.user.id,
      actionByName: `${user.firstName} ${user.lastName}`,
      actionByRole: user.role?.name,
      actionAt: new Date(),
      comments,
      newData: data
    });

    if (isLastLevel) {
      request.status = 'approved';
      await applyApprovalEffects(request);
    } else {
      request.currentLevel += 1;
      const nextLevel = workflow.levels.find(l => l.order === request.currentLevel);
      if (nextLevel) {
        request.currentLevelConfig = {
          approverRole: nextLevel.approverRole,
          approverRoleCode: nextLevel.approverRoleCode,
          approverUser: nextLevel.approverUser,
          requiredPermission: nextLevel.requiredPermission,
          maxAmount: nextLevel.maxAmount
        };
        request.eligibleApprovers = await getEligibleApprovers(workflow, request);
      }
    }

    await request.save();

    await AuditLog.create({
      school: req.tenantQuery.school,
      user: req.user.id,
      action: 'APPROVE',
      module: 'APPROVAL',
      entity: 'ApprovalRequest',
      entityId: request._id,
      newValues: { level: request.currentLevel, isFinal: isLastLevel }
    });

    res.json({ 
      message: isLastLevel ? 'Request approved' : `Approved at level ${request.currentLevel - 1}`, 
      request 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, data } = req.body;

    const request = await ApprovalRequest.findOne({
      _id: id,
      school: req.tenantQuery.school,
      status: 'pending'
    }).populate('workflow');

    if (!request) return res.status(404).json({ message: 'Approval request not found or already processed' });

    const user = await User.findById(req.user.id).populate('role');
    const workflow = await ApprovalWorkflow.findById(request.workflow);

    if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN'].includes(user.role?.code)) {
      if (workflow) {
        const permission = await checkApproverPermission(user, request, workflow);
        if (!permission.allowed) {
          return res.status(403).json({ message: permission.reason });
        }
      }
    }

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    request.status = 'rejected';
    request.rejectionReason = reason;
    request.history.push({
      level: request.currentLevel,
      action: 'reject',
      actionBy: req.user.id,
      actionByName: `${user.firstName} ${user.lastName}`,
      actionByRole: user.role?.name,
      actionAt: new Date(),
      comments: reason,
      previousData: request.data,
      newData: data
    });

    await request.save();

    await revertApprovalEffects(request);

    await AuditLog.create({
      school: req.tenantQuery.school,
      user: req.user.id,
      action: 'REJECT',
      module: 'APPROVAL',
      entity: 'ApprovalRequest',
      entityId: request._id,
      newValues: { reason }
    });

    res.json({ message: 'Request rejected', request });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await ApprovalRequest.findOne({
      _id: id,
      school: req.tenantQuery.school,
      requester: req.user.id,
      status: 'pending'
    });

    if (!request) return res.status(404).json({ message: 'Approval request not found, already processed, or not yours to cancel' });

    request.status = 'cancelled';
    request.cancellationReason = reason;
    request.history.push({
      level: request.currentLevel,
      action: 'cancel',
      actionBy: req.user.id,
      actionByName: `${req.user.firstName} ${req.user.lastName}`,
      actionAt: new Date(),
      comments: reason || 'Cancelled by requester'
    });

    await request.save();
    await revertApprovalEffects(request);

    res.json({ message: 'Request cancelled', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const escalateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { toUser, reason } = req.body;

    const request = await ApprovalRequest.findOne({
      _id: id,
      school: req.tenantQuery.school,
      status: 'pending'
    });

    if (!request) return res.status(404).json({ message: 'Approval request not found' });

    const user = await User.findById(req.user.id);
    const escalatorUser = await User.findById(toUser);

    request.status = 'escalated';
    request.history.push({
      level: request.currentLevel,
      action: 'escalate',
      actionBy: req.user.id,
      actionByName: `${user.firstName} ${user.lastName}`,
      actionAt: new Date(),
      comments: reason,
      newData: { escalatedTo: toUser, escalatedToName: `${escalatorUser.firstName} ${escalatorUser.lastName}` }
    });

    await request.save();

    await AuditLog.create({
      school: req.tenantQuery.school,
      user: req.user.id,
      action: 'UPDATE',
      module: 'APPROVAL',
      entity: 'ApprovalRequest',
      entityId: request._id,
      newValues: { escalatedTo: toUser, reason }
    });

    res.json({ message: 'Request escalated', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const applyApprovalEffects = async (request) => {
  try {
    switch (request.type) {
      case 'admission':
        if (request.referenceId) {
          await Student.findByIdAndUpdate(request.referenceId, {
            admissionStatus: 'Approved',
            approvedBy: request.requester,
            approvedAt: new Date()
          });
        }
        break;

      case 'leave':
        if (request.referenceId) {
          await Leave.findByIdAndUpdate(request.referenceId, {
            status: 'Approved',
            approvedBy: request.requester,
            approvedOn: new Date()
          });
        }
        break;

      case 'fee_concession':
      case 'fee_waiver':
        if (request.referenceId && request.data?.concessionAmount) {
          const fee = await Fee.findById(request.referenceId);
          if (fee) {
            const concessionAmount = request.data.concessionType === 'percentage'
              ? fee.amount * request.data.concessionAmount / 100
              : request.data.concessionAmount;
            await Fee.findByIdAndUpdate(request.referenceId, {
              concessionAmount,
              amount: fee.amount - concessionAmount,
              'concessionApproval.status': 'approved',
              'concessionApproval.approvedAt': new Date()
            });
          }
        }
        break;

      default:
        break;
    }
  } catch (error) {
    console.error('Error applying approval effects:', error);
  }
};

const revertApprovalEffects = async (request) => {
  try {
    switch (request.type) {
      case 'admission':
        if (request.referenceId) {
          await Student.findByIdAndUpdate(request.referenceId, {
            admissionStatus: 'Pending',
            approvedBy: null,
            approvedAt: null
          });
        }
        break;

      case 'leave':
        if (request.referenceId) {
          await Leave.findByIdAndUpdate(request.referenceId, {
            status: 'Rejected',
            approvedBy: null,
            approvedOn: null
          });
        }
        break;

      case 'fee_concession':
      case 'fee_waiver':
        if (request.referenceId) {
          await Fee.findByIdAndUpdate(request.referenceId, {
            'concessionApproval.status': 'rejected'
          });
        }
        break;

      default:
        break;
    }
  } catch (error) {
    console.error('Error reverting approval effects:', error);
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await ApprovalRequest.find({
      school: req.tenantQuery.school,
      requester: req.user.id
    })
    .populate('workflow', 'name')
    .sort({ createdAt: -1 });
    res.json(requests.map(r => ({
      ...r.toObject(),
      typeLabel: typeLabels[r.type]
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getApprovalStats = async (req, res) => {
  try {
    const school = req.tenantQuery.school;

    const [pending, approved, rejected, byType] = await Promise.all([
      ApprovalRequest.countDocuments({ school, status: 'pending' }),
      ApprovalRequest.countDocuments({ school, status: 'approved' }),
      ApprovalRequest.countDocuments({ school, status: 'rejected' }),
      ApprovalRequest.aggregate([
        { $match: { school } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
      byType: byType.map(t => ({
        type: t._id,
        label: typeLabels[t._id] || t._id,
        count: t.count
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({}).select('name code permissions');
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const initializeDefaultWorkflows = async (schoolId) => {
  const Role = require('../models/Role');
  const adminRole = await Role.findOne({ code: 'SCHOOL_ADMIN' });
  const superAdminRole = await Role.findOne({ code: 'SUPER_ADMIN' });

  const defaultWorkflows = [
    {
      school: schoolId,
      name: 'Student Admission Approval',
      type: 'admission',
      description: 'Approve new student admissions',
      isActive: true,
      isDefault: true,
      levels: [{
        order: 1,
        approverType: 'role',
        approverRole: adminRole?._id,
        approverRoleCode: 'SCHOOL_ADMIN',
        requiredPermission: 'admission:approve'
      }]
    },
    {
      school: schoolId,
      name: 'Leave Request Approval',
      type: 'leave',
      description: 'Approve staff leave requests',
      isActive: true,
      isDefault: true,
      levels: [{
        order: 1,
        approverType: 'role',
        approverRole: adminRole?._id,
        approverRoleCode: 'SCHOOL_ADMIN',
        requiredPermission: 'leave:approve'
      }]
    },
    {
      school: schoolId,
      name: 'Fee Concession Approval',
      type: 'fee_concession',
      description: 'Approve fee concessions for students',
      isActive: true,
      isDefault: true,
      levels: [{
        order: 1,
        approverType: 'role',
        approverRole: adminRole?._id,
        approverRoleCode: 'SCHOOL_ADMIN',
        requiredPermission: 'fee:approve',
        maxAmount: 5000
      }]
    },
    {
      school: schoolId,
      name: 'Fee Waiver Approval',
      type: 'fee_waiver',
      description: 'Approve full fee waivers',
      isActive: true,
      isDefault: true,
      levels: [{
        order: 1,
        approverType: 'role',
        approverRole: superAdminRole?._id,
        approverRoleCode: 'SUPER_ADMIN',
        requiredPermission: 'fee:approve',
        maxAmount: 50000
      }]
    },
    {
      school: schoolId,
      name: 'Admin Action Approval',
      type: 'admin_action',
      description: 'Approve sensitive administrative actions',
      isActive: true,
      isDefault: true,
      levels: [{
        order: 1,
        approverType: 'role',
        approverRole: superAdminRole?._id,
        approverRoleCode: 'SUPER_ADMIN',
        requiredPermission: 'admin:approve'
      }]
    }
  ];

  for (const workflow of defaultWorkflows) {
    const existing = await ApprovalWorkflow.findOne({ school: schoolId, type: workflow.type });
    if (!existing) {
      await ApprovalWorkflow.create(workflow);
    }
  }
};

module.exports = {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getPendingApprovals,
  getMyPendingApprovals,
  getApprovalById,
  submitForApproval,
  approveRequest,
  rejectRequest,
  cancelRequest,
  escalateRequest,
  getMyRequests,
  getApprovalStats,
  getRoles,
  initializeDefaultWorkflows
};

