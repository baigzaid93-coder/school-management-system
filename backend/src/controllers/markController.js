const Mark = require('../models/Mark');

exports.getAll = async (req, res) => {
  try {
    const { exam, student, subject } = req.query;
    const query = { ...req.tenantQuery };
    if (exam) query.exam = exam;
    if (student) query.student = student;
    if (subject) query.subject = subject;
    
    const marks = await Mark.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('subject', 'name code')
      .populate('exam', 'name');
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getByStudent = async (req, res) => {
  try {
    const { academicYear, term } = req.query;
    const query = { student: req.params.studentId };
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;
    
    const marks = await Mark.find(query)
      .populate('subject', 'name code')
      .populate('exam', 'name');
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getByExam = async (req, res) => {
  try {
    const marks = await Mark.find({ exam: req.params.examId })
      .populate('student', 'firstName lastName studentId rollNumber')
      .populate('subject', 'name code');
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const mark = new Mark(req.body);
    await mark.save();
    res.status(201).json(mark);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.bulkCreate = async (req, res) => {
  try {
    const { marks } = req.body;
    const schoolId = req.tenantQuery?.school || req.user?.school;
    
    const results = [];
    for (const markData of marks) {
      // Try to find existing mark by exam + student + subject
      const existing = await Mark.findOne({
        exam: markData.exam,
        student: markData.student,
        subject: markData.subject
      });
      
      if (existing) {
        // Update existing
        existing.marksObtained = markData.marksObtained;
        existing.maxMarks = markData.maxMarks;
        existing.isAbsent = markData.isAbsent;
        await existing.save();
        results.push(existing);
      } else {
        // Create new
        const mark = new Mark({ ...markData, school: schoolId });
        await mark.save();
        results.push(mark);
      }
    }
    
    res.status(201).json({ message: `${results.length} marks saved`, created: results });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const mark = await Mark.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true }
    );
    if (!mark) return res.status(404).json({ message: 'Mark not found' });
    res.json(mark);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const mark = await Mark.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    if (!mark) return res.status(404).json({ message: 'Mark not found' });
    res.json({ message: 'Mark deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReportCard = async (req, res) => {
  try {
    const { studentId, academicYear, term } = req.query;
    const query = { student: studentId };
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;
    
    const marks = await Mark.find(query)
      .populate('subject', 'name code')
      .populate('exam', 'name');
    
    const totalMarks = marks.reduce((sum, m) => sum + m.marksObtained, 0);
    const totalMax = marks.reduce((sum, m) => sum + m.maxMarks, 0);
    const percentage = totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(2) : 0;
    
    res.json({
      marks,
      summary: {
        totalMarks,
        totalMax,
        percentage,
        grade: percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
