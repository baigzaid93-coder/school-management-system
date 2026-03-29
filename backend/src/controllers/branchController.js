const Branch = require('../models/Branch');

exports.getAll = async (req, res) => {
  try {
    const query = { ...req.tenantQuery };
    const branches = await Branch.find(query).populate('manager', 'firstName lastName');
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id).populate('manager', 'firstName lastName email');
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const tenantQuery = req.tenantQuery || {};
    const schoolId = tenantQuery.school;
    
    const branch = new Branch({ ...req.body, school: schoolId });
    await branch.save();
    res.status(201).json(branch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json(branch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
