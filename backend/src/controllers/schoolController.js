const School = require('../models/School');
const User = require('../models/User');
const Role = require('../models/Role');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const ClassGrade = require('../models/ClassGrade');
const Subject = require('../models/Subject');
const bcrypt = require('bcryptjs');

exports.getAll = async (req, res) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 });
    res.json(schools);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });
    res.json(school);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, code, email, phone, address, modules, subscription, adminEmail, adminPassword } = req.body;

    const existing = await School.findOne({ $or: [{ code }, { 'address.city': address?.city }] });
    if (existing) {
      return res.status(400).json({ message: 'School with this code or city already exists' });
    }

    const school = new School({
      name,
      code,
      email,
      phone,
      address,
      modules: modules || ['student', 'teacher', 'attendance', 'fees', 'exams', 'grades', 'reports', 'timetable', 'subjects', 'classes'],
      subscription: {
        plan: subscription?.plan || 'Trial',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'Trial',
        ...subscription
      }
    });
    await school.save();

    const superAdminRole = await Role.findOne({ code: 'SUPER_ADMIN' });
    const schoolAdminRole = await Role.findOne({ code: 'SCHOOL_ADMIN' });

    if (adminEmail) {
      const existingUser = await User.findOne({ email: adminEmail });
      if (existingUser) {
        return res.status(400).json({ message: 'Admin user already exists with this email' });
      }

      const adminUser = new User({
        username: `${code.toLowerCase()}.admin`,
        email: adminEmail,
        password: adminPassword || 'school123',
        role: schoolAdminRole._id,
        school: school._id,
        isSchoolAdmin: true,
        isActive: true,
        profile: {
          firstName: name,
          lastName: 'Admin'
        }
      });
      await adminUser.save();

      school.adminUser = adminUser._id;
      await school.save();
    }

    res.status(201).json(school);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!school) return res.status(404).json({ message: 'School not found' });
    res.json(school);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateModules = async (req, res) => {
  try {
    const { modules } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { modules },
      { new: true }
    );
    if (!school) return res.status(404).json({ message: 'School not found' });
    res.json(school);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { subscription: { ...school.subscription, ...subscription } },
      { new: true }
    );
    if (!school) return res.status(404).json({ message: 'School not found' });
    res.json(school);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });
    
    await User.deleteMany({ school: req.params.id });
    
    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const stats = {
      students: await Student.countDocuments({ school: req.params.id }),
      teachers: await Teacher.countDocuments({ school: req.params.id }),
      parents: await Parent.countDocuments({ school: req.params.id }),
      classes: await ClassGrade.countDocuments({ school: req.params.id }),
      subjects: await Subject.countDocuments({ school: req.params.id }),
      subscription: school.subscription
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
