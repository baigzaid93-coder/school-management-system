const Grade = require('../models/Grade');

exports.getAllGrades = async (req, res) => {
  try {
    let query = { ...req.tenantQuery };
    
    if (req.user.role?.code === 'TEACHER') {
      const Teacher = require('../models/Teacher');
      const teacher = await Teacher.findOne({ email: req.user.email, school: req.tenantQuery.school });
      if (teacher && teacher.courses && teacher.courses.length > 0) {
        query.course = { $in: teacher.courses };
      } else {
        return res.json([]);
      }
    }
    
    if (req.user.role?.code === 'STUDENT') {
      const Student = require('../models/Student');
      const student = await Student.findOne({ userId: req.user.id });
      if (!student) return res.json([]);
      query.student = student._id;
    }
    
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
    
    const teacher = await Teacher.findOne({ email: req.user.email, school: req.tenantQuery?.school });
    
    if (!teacher) return res.json([]);
    
    if (!teacher.courses || teacher.courses.length === 0) {
      return res.json([]);
    }
    
    const grades = await Grade.find({ 
      course: { $in: teacher.courses },
      ...req.tenantQuery
    })
      .populate('student', 'firstName lastName studentId')
      .populate('course', 'name code');
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGradesByStudent = async (req, res) => {
  try {
    let studentId = req.params.studentId;
    
    if (req.user.role?.code === 'STUDENT') {
      const Student = require('../models/Student');
      const student = await Student.findOne({ userId: req.user.id });
      if (!student) return res.status(404).json({ message: 'Student profile not found' });
      studentId = student._id;
    }
    
    if (req.user.role?.code === 'PARENT') {
      const Parent = require('../models/Parent');
      const parent = await Parent.findOne({ userId: req.user.id }).populate('students');
      if (!parent) return res.status(404).json({ message: 'Parent profile not found' });
      const childIds = parent.students.map(s => s._id);
      if (!childIds.includes(studentId)) {
        return res.status(403).json({ message: 'You can only view your children\'s grades' });
      }
    }
    
    let query = { student: studentId };
    if (req.tenantQuery?.school) {
      query.school = req.tenantQuery.school;
    }
    
    const grades = await Grade.find(query)
      .populate('course', 'name code');
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGradesBySubject = async (req, res) => {
  try {
    const grades = await Grade.find({ subject: req.params.subjectId })
      .populate('student', 'firstName lastName studentId');
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createGrade = async (req, res) => {
  try {
    if (req.user.role?.code === 'TEACHER') {
      const Teacher = require('../models/Teacher');
      const teacher = await Teacher.findOne({ email: req.user.email, school: req.tenantQuery?.school });
      if (teacher && teacher.courses && teacher.courses.length > 0) {
        if (req.body.course && !teacher.courses.includes(req.body.course)) {
          return res.status(403).json({ message: 'You can only add grades for your assigned courses' });
        }
      }
    }
    
    if (req.user.role?.code === 'STUDENT' || req.user.role?.code === 'PARENT') {
      return res.status(403).json({ message: 'You are not authorized to add grades' });
    }
    
    const gradeData = { ...req.body };
    if (req.tenantQuery?.school) {
      gradeData.school = req.tenantQuery.school;
    }
    
    const grade = new Grade(gradeData);
    await grade.save();
    res.status(201).json(grade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateGrade = async (req, res) => {
  try {
    if (req.user.role?.code === 'STUDENT' || req.user.role?.code === 'PARENT') {
      return res.status(403).json({ message: 'You are not authorized to update grades' });
    }
    
    const grade = await Grade.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true }
    );
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    res.json(grade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteGrade = async (req, res) => {
  try {
    if (req.user.role?.code === 'STUDENT' || req.user.role?.code === 'PARENT') {
      return res.status(403).json({ message: 'You are not authorized to delete grades' });
    }
    
    const grade = await Grade.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
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
