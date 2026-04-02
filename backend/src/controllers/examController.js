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
    const exam = await Exam.findOne({ _id: req.params.id, ...req.tenantQuery })
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
    const { getNextDocumentNumber } = require('../utils/documentNumberGenerator');
    const schoolId = req.tenantQuery?.school || req.user?.school;
    
    let examData = { ...req.body };
    
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }
    
    examData.school = schoolId;
    
    if (!examData.examId) {
      examData.examId = await getNextDocumentNumber(schoolId, 'EXAM');
    }
    
    if (!examData.academicYear && schoolId) {
      const AcademicYear = require('../models/AcademicYear');
      const currentYear = await AcademicYear.findOne({ school: schoolId, isCurrent: true });
      if (currentYear) {
        examData.academicYear = currentYear._id;
        examData.academicYearName = currentYear.name;
      } else {
        examData.academicYearName = new Date().getFullYear().toString();
      }
    }
    
    const exam = new Exam(examData);
    await exam.save();
    res.status(201).json(exam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const exam = await Exam.findOneAndUpdate({ _id: req.params.id, ...req.tenantQuery }, req.body, { new: true });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const exam = await Exam.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.publishResults = async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, ...req.tenantQuery });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    exam.publishResults = true;
    await exam.save();
    res.json({ message: 'Results published', exam });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
