const Staff = require('../models/Staff');
const { generateStaffMemberId } = require('../utils/idGenerator');

exports.getAll = async (req, res) => {
  try {
    const { department, role, status, search } = req.query;
    const query = { ...req.tenantQuery };
    if (department) query.department = department;
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { staffId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const staff = await Staff.find(query)
      .populate('department', 'name')
      .populate('role', 'name')
      .sort({ staffId: 1 });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, ...req.tenantQuery })
      .populate('department', 'name')
      .populate('role', 'name');
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const tenantQuery = req.tenantQuery || {};
    const schoolId = tenantQuery.school || req.body.school;
    
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }
    
    const staffId = req.body.staffId || await generateStaffMemberId(schoolId);
    
    const staff = new Staff({ ...req.body, school: schoolId, staffId: staffId });
    await staff.save();
    res.status(201).json(staff);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true }
    );
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json(staff);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const staff = await Staff.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
