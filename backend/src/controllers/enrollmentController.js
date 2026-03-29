const Enrollment = require('../models/Enrollment');

exports.getAll = async (req, res) => {
  try {
    const { academicYear, classGrade, section, status } = req.query;
    const query = { ...req.tenantQuery };
    if (academicYear) query.academicYear = academicYear;
    if (classGrade) query.classGrade = classGrade;
    if (section) query.section = section;
    if (status) query.status = status;
    
    const enrollments = await Enrollment.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('classGrade', 'name code')
      .populate('section', 'name')
      .sort({ createdAt: -1 });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getByStudent = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.params.studentId })
      .populate('classGrade', 'name code')
      .populate('section', 'name')
      .populate('academicYear', 'name');
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const enrollment = new Enrollment(req.body);
    await enrollment.save();
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    res.json(enrollment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.promoteStudents = async (req, res) => {
  try {
    const { fromYear, toYear } = req.body;
    const enrollments = await Enrollment.find({ 
      academicYear: fromYear, 
      status: 'Active' 
    });
    
    const promoted = [];
    for (const enrollment of enrollments) {
      enrollment.status = 'Promoted';
      enrollment.previousClass = enrollment.classGrade;
      await enrollment.save();
      promoted.push(enrollment);
    }
    
    res.json({ message: `${promoted.length} students promoted`, promoted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
