const Parent = require('../models/Parent');
const User = require('../models/User');
const Role = require('../models/Role');

exports.getAll = async (req, res) => {
  try {
    const query = { ...req.tenantQuery };
    const parents = await Parent.find(query).populate('students', 'firstName lastName studentId').populate('userId', 'username email isActive role');
    res.json(parents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id).populate('students', 'firstName lastName studentId').populate('userId', 'username email isActive role');
    if (!parent) return res.status(404).json({ message: 'Parent not found' });
    res.json(parent);
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
    
    const parent = new Parent({ ...req.body, school: schoolId });
    await parent.save();
    
    const parentRole = await Role.findOne({ code: 'PARENT' });
    const firstName = req.body.firstName || '';
    const lastName = req.body.lastName || '';
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const defaultPassword = `parent${firstName.toLowerCase()}123`;
    
    const existingUser = await User.findOne({ $or: [{ email: req.body.email }, { username }] });
    if (!existingUser && req.body.email) {
      const user = new User({
        username,
        email: req.body.email,
        password: defaultPassword,
        role: parentRole._id,
        profile: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          phone: req.body.phone
        }
      });
      await user.save();
      
      parent.userId = user._id;
      await parent.save();
    }
    
    await parent.populate('userId', 'username email isActive role');
    res.status(201).json(parent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const parent = await Parent.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('userId', 'username email isActive role');
    if (!parent) return res.status(404).json({ message: 'Parent not found' });
    res.json(parent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const parent = await Parent.findByIdAndDelete(req.params.id);
    if (!parent) return res.status(404).json({ message: 'Parent not found' });
    
    if (parent.userId) {
      await User.findByIdAndDelete(parent.userId);
    }
    
    res.json({ message: 'Parent deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
