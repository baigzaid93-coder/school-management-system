const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Role = require('../models/Role');
const { generateTeacherId } = require('../utils/idGenerator');

exports.getAllTeachers = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = { ...req.tenantQuery };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const teachers = await Teacher.find(query)
      .populate('courses', 'name code')
      .populate('assignedClass', 'name')
      .populate('userId', 'username email isActive role')
      .sort({ teacherId: 1 });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const query = { email: user.email };
    if (req.tenantQuery?.school) {
      query.school = req.tenantQuery.school;
    }
    
    const teacher = await Teacher.findOne(query).populate('courses', 'name code students').populate('assignedClass', 'name');
    if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
    
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params.id, ...req.tenantQuery }).populate('courses', 'name code').populate('assignedClass', 'name').populate('userId', 'username email isActive role');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOneAndUpdate({ _id: req.params.id, ...req.tenantQuery }, req.body, { new: true }).populate('userId', 'username email isActive role');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json(teacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    
    if (teacher.userId) {
      await User.findByIdAndDelete(teacher.userId);
    }
    
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTeacher = async (req, res) => {
  try {
    const tenantQuery = req.tenantQuery || {};
    const schoolId = tenantQuery.school || req.body.school;
    
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }
    
    const teacherId = req.body.teacherId || await generateTeacherId(schoolId);
    
    const data = { ...req.body, school: schoolId, teacherId: teacherId };
    if (!data.dateOfBirth) {
      data.dateOfBirth = new Date('1990-01-01');
    }
    if (!data.gender) {
      data.gender = 'Male';
    }
    
    const teacher = new Teacher(data);
    await teacher.save();
    
    const teacherRole = await Role.findOne({ code: 'TEACHER' });
    const firstName = data.firstName || '';
    const lastName = data.lastName || '';
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const defaultPassword = `teacher${firstName.toLowerCase()}123`;
    
    const existingUser = await User.findOne({ $or: [{ email: data.email }, { username }] });
    if (!existingUser && data.email) {
      const user = new User({
        username,
        email: data.email,
        password: defaultPassword,
        role: teacherRole._id,
        school: schoolId,
        profile: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone
        },
        teacherId: teacher._id
      });
      await user.save();
      
      teacher.userId = user._id;
      await teacher.save();
    }
    
    await teacher.populate('userId', 'username email isActive role');
    res.status(201).json(teacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true }
    );
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json(teacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
