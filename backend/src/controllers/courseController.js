const Course = require('../models/Course');

exports.getAllCourses = async (req, res) => {
  try {
    const query = { ...req.tenantQuery };
    const courses = await Course.find(query)
      .populate('teacher', 'firstName lastName email')
      .populate('students', 'firstName lastName studentId');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, ...req.tenantQuery })
      .populate('teacher', 'firstName lastName email phone')
      .populate('students', 'firstName lastName studentId');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate({ _id: req.params.id, ...req.tenantQuery }, req.body, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addStudentToCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, ...req.tenantQuery });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    if (!course.students.includes(req.body.studentId)) {
      course.students.push(req.body.studentId);
      await course.save();
    }
    res.json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
