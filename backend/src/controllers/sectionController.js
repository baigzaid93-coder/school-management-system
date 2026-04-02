const Section = require('../models/Section');

exports.getAll = async (req, res) => {
  try {
    const query = req.tenantQuery ? { ...req.tenantQuery } : {};
    const sections = await Section.find(query)
      .populate('classGrade', 'name code level')
      .populate('teacher', 'firstName lastName')
      .populate('academicYear', 'name');
    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getByClass = async (req, res) => {
  try {
    const sections = await Section.find({ classGrade: req.params.classId })
      .populate('classTeacher', 'firstName lastName');
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const tenantQuery = req.tenantQuery || {};
    const schoolId = tenantQuery.school;
    
    const section = new Section({ ...req.body, school: schoolId });
    await section.save();
    res.status(201).json(section);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const section = await Section.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true }
    );
    if (!section) return res.status(404).json({ message: 'Section not found' });
    res.json(section);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const section = await Section.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    if (!section) return res.status(404).json({ message: 'Section not found' });
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
