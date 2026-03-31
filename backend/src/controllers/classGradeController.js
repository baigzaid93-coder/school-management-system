const ClassGrade = require('../models/ClassGrade');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Section = require('../models/Section');

exports.getAll = async (req, res) => {
  try {
    const query = req.tenantQuery ? { ...req.tenantQuery } : {};
    const classGrades = await ClassGrade.find(query)
      .populate('subjects', 'name code')
      .populate('sections', 'name capacity students teacher');
    
    const result = await Promise.all(classGrades.map(async (cg) => {
      const students = await Student.find({ classGrade: cg._id, status: 'Active', ...req.tenantQuery });
      const sections = await Section.find({ classGrade: cg._id, ...req.tenantQuery }).populate('teacher', 'firstName lastName');
      
      return {
        ...cg.toObject(),
        studentCount: students.length,
        sections: sections.map(s => ({
          ...s.toObject(),
          studentCount: s.students?.length || 0
        }))
      };
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Error in getAll:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const classGrade = await ClassGrade.findOne({ _id: req.params.id, ...req.tenantQuery })
      .populate('subjects', 'name code');
    
    if (!classGrade) return res.status(404).json({ message: 'Class grade not found' });
    
    const students = await Student.find({ classGrade: req.params.id, ...req.tenantQuery })
      .populate('userId', 'username email isActive')
      .populate('section', 'name code');
    const sections = await Section.find({ classGrade: req.params.id, ...req.tenantQuery })
      .populate('teacher', 'firstName lastName email')
      .populate('students', 'firstName lastName studentId');
    
    res.json({
      ...classGrade.toObject(),
      students,
      sections
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const tenantQuery = req.tenantQuery || {};
    const schoolId = tenantQuery.school;
    
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }
    
    const existing = await ClassGrade.findOne({ 
      $or: [
        { code: req.body.code, school: schoolId },
        { name: req.body.name, school: schoolId }
      ]
    });
    if (existing) {
      return res.status(400).json({ message: 'Class grade already exists with this name or code for this school' });
    }
    
    const classGrade = new ClassGrade({ ...req.body, school: schoolId });
    await classGrade.save();
    res.status(201).json(classGrade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const classGrade = await ClassGrade.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true }
    );
    if (!classGrade) return res.status(404).json({ message: 'Class grade not found' });
    res.json(classGrade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const classGrade = await ClassGrade.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    if (!classGrade) return res.status(404).json({ message: 'Class grade not found' });
    
    await Section.deleteMany({ classGrade: req.params.id, ...req.tenantQuery });
    await Student.updateMany({ classGrade: req.params.id, ...req.tenantQuery }, { classGrade: null });
    
    res.json({ message: 'Class grade deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, section } = req.query;
    const query = { classGrade: req.params.id };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (section && section.trim()) {
      query.section = section;
    }
    
    const students = await Student.find(query)
      .populate('userId', 'username email isActive')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Student.countDocuments(query);
    
    res.json({
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    student.classGrade = req.params.id;
    if (req.body.section && req.body.section.trim()) student.section = req.body.section;
    await student.save();
    
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.removeStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.studentId,
      { classGrade: null, section: null },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSections = async (req, res) => {
  try {
    const sections = await Section.find({ classGrade: req.params.id })
      .populate('teacher', 'firstName lastName email');
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createSection = async (req, res) => {
  try {
    const section = new Section({
      ...req.body,
      classGrade: req.params.id
    });
    await section.save();
    res.status(201).json(section);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateSection = async (req, res) => {
  try {
    const section = await Section.findOneAndUpdate(
      { _id: req.params.sectionId, ...req.tenantQuery },
      req.body,
      { new: true }
    );
    if (!section) return res.status(404).json({ message: 'Section not found' });
    res.json(section);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    await Section.findOneAndDelete({ _id: req.params.sectionId, ...req.tenantQuery });
    await Student.updateMany({ section: req.params.sectionId, ...req.tenantQuery }, { section: null });
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addStudentToSection = async (req, res) => {
  try {
    const { studentId } = req.body;
    const section = await Section.findOne({ _id: req.params.sectionId, ...req.tenantQuery });
    if (!section) return res.status(404).json({ message: 'Section not found' });
    
    if (!section.students.includes(studentId)) {
      section.students.push(studentId);
      await section.save();
    }
    
    await Student.findOneAndUpdate({ _id: studentId, ...req.tenantQuery }, { section: section._id });
    
    res.json(section);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.removeStudentFromSection = async (req, res) => {
  try {
    await Section.findOneAndUpdate(
      { _id: req.params.sectionId, ...req.tenantQuery },
      { $pull: { students: req.params.studentId } }
    );
    await Student.findOneAndUpdate(
      { _id: req.params.studentId, ...req.tenantQuery },
      { section: null }
    );
    res.json({ message: 'Student removed from section' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
