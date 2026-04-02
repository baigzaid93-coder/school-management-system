const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

exports.getAllAttendance = async (req, res) => {
  try {
    const { attendeeType, date, classGrade, courseId } = req.query;
    let query = { ...req.tenantQuery };
    
    if (req.user.role?.code === 'TEACHER') {
      const Teacher = require('../models/Teacher');
      const teacher = await Teacher.findOne({ email: req.user.email, school: req.tenantQuery?.school });
      if (teacher && teacher.courses && teacher.courses.length > 0) {
        query.course = { $in: teacher.courses };
      } else {
        return res.json([]);
      }
    }
    
    if (req.user.role?.code === 'STUDENT') {
      const student = await Student.findOne({ userId: req.user.id });
      if (!student) return res.json([]);
      query.student = student._id;
    }
    
    if (attendeeType) {
      query.attendeeType = attendeeType;
    }
    if (classGrade) {
      query.classGrade = classGrade;
    }
    if (courseId && req.user.role?.code !== 'TEACHER') {
      query.course = courseId;
    }
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    
    const attendance = await Attendance.find(query)
      .populate('student', 'firstName lastName studentId classGrade')
      .populate('teacher', 'firstName lastName teacherId')
      .populate('course', 'name code')
      .sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAttendanceByStudent = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let studentId = req.params.studentId;
    
    if (req.user.role?.code === 'STUDENT') {
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
        return res.status(403).json({ message: 'You can only view your children\'s attendance' });
      }
    }
    
    const query = { 
      attendeeType: 'student',
      student: studentId,
      ...req.tenantQuery
    };
    
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const attendance = await Attendance.find(query)
      .populate('course', 'name code')
      .sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAttendanceByTeacher = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const query = { 
      attendeeType: 'teacher',
      teacher: req.params.teacherId,
      ...req.tenantQuery
    };
    
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    if (status) {
      query.status = status;
    }
    
    const attendance = await Attendance.find(query)
      .sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAttendanceByCourse = async (req, res) => {
  try {
    const { date } = req.query;
    const query = { 
      course: req.params.courseId,
      ...req.tenantQuery
    };
    
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    
    const attendance = await Attendance.find(query)
      .populate('student', 'firstName lastName studentId');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    if (req.user.role?.code === 'STUDENT' || req.user.role?.code === 'PARENT') {
      return res.status(403).json({ message: 'You are not authorized to mark attendance' });
    }
    
    const { attendeeType, student, teacher, course, date, status, remarks, classGrade } = req.body;
    
    const tenantQuery = req.tenantQuery || {};
    
    if (req.user.role?.code === 'TEACHER' && attendeeType === 'student') {
      const Teacher = require('../models/Teacher');
      const teacherRecord = await Teacher.findOne({ email: req.user.email, school: tenantQuery?.school });
      if (teacherRecord && teacherRecord.courses && teacherRecord.courses.length > 0) {
        if (course && !teacherRecord.courses.includes(course)) {
          return res.status(403).json({ message: 'You can only mark attendance for your assigned courses' });
        }
        if (!course) {
          return res.status(400).json({ message: 'Course is required for marking attendance' });
        }
      }
    }
    
    let schoolId = tenantQuery.school;
    if (!schoolId) {
      schoolId = req.body.school;
    }
    
    if (!schoolId && attendeeType === 'teacher' && teacher) {
      const teacherData = await Teacher.findById(teacher);
      if (teacherData) {
        schoolId = teacherData.school;
      }
    }
    
    if (!schoolId && attendeeType === 'student' && student) {
      const studentData = await Student.findById(student);
      if (studentData) {
        schoolId = studentData.school;
      }
    }
    
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required. Please select a school first.' });
    }
    
    let existingQuery = { 
      date: new Date(new Date(date).setHours(0, 0, 0, 0)),
      school: schoolId
    };
    
    if (attendeeType === 'teacher' && teacher) {
      existingQuery.teacher = teacher;
      existingQuery.attendeeType = 'teacher';
      
      const teacherData = await Teacher.findById(teacher);
      if (!teacherData) {
        return res.status(400).json({ message: 'Teacher not found' });
      }
    } else if (attendeeType === 'student' && student) {
      existingQuery.student = student;
      existingQuery.attendeeType = 'student';
      
      const studentData = await Student.findById(student);
      if (!studentData) {
        return res.status(400).json({ message: 'Student not found' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid attendee type or missing ID', attendeeType, student, teacher });
    }
    
    const existing = await Attendance.findOne(existingQuery);
    if (existing) {
      existing.status = status;
      existing.remarks = remarks;
      existing.markedBy = req.user._id;
      await existing.save();
      return res.json(existing);
    }
    
    const attendance = new Attendance({
      attendeeType,
      student: attendeeType === 'student' ? student : undefined,
      teacher: attendeeType === 'teacher' ? teacher : undefined,
      course,
      date: new Date(date),
      status,
      remarks,
      school: schoolId,
      classGrade: attendeeType === 'student' ? classGrade : undefined,
      markedBy: req.user._id
    });
    
    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.bulkMarkAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;
    const tenantQuery = req.tenantQuery || {};
    const schoolId = tenantQuery.school;
    
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }
    
    const results = [];
    
    for (const record of attendanceRecords) {
      const existingQuery = { 
        date: new Date(new Date(record.date).setHours(0, 0, 0, 0)) 
      };
      
      if (record.attendeeType === 'student' && record.student) {
        existingQuery.student = record.student;
      } else if (record.attendeeType === 'teacher' && record.teacher) {
        existingQuery.teacher = record.teacher;
      } else {
        continue;
      }
      
      const existing = await Attendance.findOne(existingQuery);
      
      if (existing) {
        existing.status = record.status;
        existing.remarks = record.remarks;
        await existing.save();
        results.push(existing);
      } else {
        const newRecord = new Attendance({
          attendeeType: record.attendeeType,
          student: record.attendeeType === 'student' ? record.student : undefined,
          teacher: record.attendeeType === 'teacher' ? record.teacher : undefined,
          course: record.course,
          date: new Date(record.date),
          status: record.status,
          remarks: record.remarks,
          school: schoolId,
          classGrade: record.classGrade,
          markedBy: req.user._id
        });
        await newRecord.save();
        results.push(newRecord);
      }
    }
    
    res.json(results);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAttendanceStats = async (req, res) => {
  try {
    const { attendeeType, studentId, teacherId, startDate, endDate } = req.query;
    
    const match = { ...req.tenantQuery };
    
    if (attendeeType) match.attendeeType = attendeeType;
    if (studentId) match.student = studentId;
    if (teacherId) match.teacher = teacherId;
    if (startDate && endDate) {
      match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const stats = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const percentage = {};
    stats.forEach(s => {
      percentage[s._id] = total > 0 ? ((s.count / total) * 100).toFixed(2) : 0;
    });
    
    res.json({ stats, total, percentage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
