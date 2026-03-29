const Exam = require('../models/Exam');

exports.getAll = async (req, res) => {
  try {
    const { academicYear, classGrade, status } = req.query;
    const query = { ...req.tenantQuery };
    if (academicYear) query.academicYear = academicYear;
    if (classGrade) query.classGrade = classGrade;
    if (status) query.status = status;
    
    const exams = await Exam.find(query)
      .populate('examType', 'name code')
      .populate('classGrade', 'name code')
      .populate('academicYear', 'name')
      .sort({ startDate: -1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('examType', 'name code')
      .populate('classGrade', 'name code')
      .populate('subjects.subject', 'name code');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const exam = new Exam(req.body);
    await exam.save();
    res.status(201).json(exam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.publishResults = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    exam.publishResults = true;
    await exam.save();
    res.json({ message: 'Results published', exam });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
