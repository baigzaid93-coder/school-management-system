const Subject = require('../models/Subject');

exports.getAll = async (req, res) => {
  try {
    const { classGrade, teacher } = req.query;
    let query = req.tenantQuery ? { ...req.tenantQuery } : {};
    
    if (classGrade) {
      query.classGrade = classGrade;
    }
    if (teacher) {
      query.teachers = teacher;
    }
    
    const subjects = await Subject.find(query)
      .populate('classGrade', 'name code level')
      .populate('teachers', 'firstName lastName email')
      .sort({ name: 1 });
    res.json(subjects);
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
    
    const existing = await Subject.findOne({ code: req.body.code, school: schoolId });
    if (existing) {
      return res.status(400).json({ message: 'Subject with this code already exists' });
    }
    
    const subject = new Subject({ ...req.body, school: schoolId });
    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
