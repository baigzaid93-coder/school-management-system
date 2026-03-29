const ExamType = require('../models/ExamType');

exports.getAll = async (req, res) => {
  try {
    const types = await ExamType.find()
      .populate('term', 'name academicYear')
      .sort({ name: 1 });
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const examType = new ExamType(req.body);
    await examType.save();
    res.status(201).json(examType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const examType = await ExamType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!examType) return res.status(404).json({ message: 'Exam type not found' });
    res.json(examType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const examType = await ExamType.findByIdAndDelete(req.params.id);
    if (!examType) return res.status(404).json({ message: 'Exam type not found' });
    res.json({ message: 'Exam type deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
