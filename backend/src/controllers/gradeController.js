const Grade = require('../models/Grade');

exports.getAllGrades = async (req, res) => {
  try {
    const query = { ...req.tenantQuery };
    const grades = await Grade.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('course', 'name code');
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTeacherGrades = async (req, res) => {
  try {
    const Teacher = require('../models/Teacher');
    const User = require('../models/User');
    
    const user = await User.findById(req.user.id);
    const teacher = await Teacher.findOne({ email: user.email });
    
    if (!teacher) return res.json([]);
    
    const grades = await Grade.find({ course: { $in: teacher.courses } })
      .populate('student', 'firstName lastName studentId')
      .populate('course', 'name code');
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGradesByStudent = async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.params.studentId })
      .populate('course', 'name code');
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGradesByCourse = async (req, res) => {
  try {
    const grades = await Grade.find({ course: req.params.courseId })
      .populate('student', 'firstName lastName studentId');
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createGrade = async (req, res) => {
  try {
    const grade = new Grade(req.body);
    await grade.save();
    res.status(201).json(grade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateGrade = async (req, res) => {
  try {
    const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    res.json(grade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.id);
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    res.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentAverage = async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.params.studentId });
    if (grades.length === 0) return res.json({ average: 0 });
    
    const totalWeight = grades.reduce((sum, g) => sum + g.weight, 0);
    const weightedSum = grades.reduce((sum, g) => sum + (g.score / g.maxScore * 100) * g.weight, 0);
    const average = (weightedSum / totalWeight).toFixed(2);
    
    res.json({ average });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
