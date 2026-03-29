const Leave = require('../models/Leave');

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
    res.status(201).json(leave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;
    
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    
    leave.status = 'Approved';
    leave.approvedBy = approvedBy;
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
    
    leave.status = 'Rejected';
    leave.approvedBy = approvedBy;
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
