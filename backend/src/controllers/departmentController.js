const Department = require('../models/Department');

exports.getAll = async (req, res) => {
  try {
    const query = req.tenantQuery ? { ...req.tenantQuery } : {};
    const departments = await Department.find(query)
      .populate('head', 'firstName lastName email')
      .sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const tenantQuery = req.tenantQuery || {};
    const schoolId = tenantQuery.school;
    
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required. Please log in again.' });
    }
    
    const existing = await Department.findOne({ 
      code: req.body.code,
      school: schoolId
    });
    if (existing) {
      return res.status(400).json({ message: 'Department with this code already exists' });
    }
    
    const department = new Department({ ...req.body, school: schoolId });
    await department.save();
    res.status(201).json(department);
  } catch (error) {
    console.error('Department create error:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true }
    );
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const department = await Department.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
