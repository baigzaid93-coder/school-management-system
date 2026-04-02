const StaffRole = require('../models/StaffRole');

exports.getAll = async (req, res) => {
  try {
    const roles = await StaffRole.find().sort({ name: 1 });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const role = new StaffRole(req.body);
    await role.save();
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const role = await StaffRole.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true }
    );
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const role = await StaffRole.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
