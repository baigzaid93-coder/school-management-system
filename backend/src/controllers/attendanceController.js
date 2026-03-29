const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

exports.getAllAttendance = async (req, res) => {
  try {
    const { attendeeType, date, classGrade } = req.query;
    const query = { ...req.tenantQuery };
    
    if (attendeeType) {
      query.attendeeType = attendeeType;
    }
    if (classGrade) {
      query.classGrade = classGrade;
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
    const query = { 
      attendeeType: 'student',
      student: req.params.studentId,
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
    console.log('=== MARK ATTENDANCE ===');
    console.log('Body:', req.body);
    console.log('Headers:', req.headers);
    console.log('Tenant query:', req.tenantQuery);
    console.log('User:', req.user);
    
    const { attendeeType, student, teacher, course, date, status, remarks, classGrade } = req.body;
    
    const tenantQuery = req.tenantQuery || {};
    console.log('Tenant query after destructuring:', tenantQuery);
    
    // If no tenantQuery.school, try to get from body
    let schoolId = tenantQuery.school;
    if (!schoolId) {
      schoolId = req.body.school;
    }
    console.log('School ID from tenant/body:', schoolId);
    
    // If still no school, try to get from teacher record
    if (!schoolId && attendeeType === 'teacher' && teacher) {
      const teacherData = await Teacher.findById(teacher);
      if (teacherData) {
        schoolId = teacherData.school;
        console.log('School ID from teacher:', schoolId);
      }
    }
    
    // Try to get school from student record
    if (!schoolId && attendeeType === 'student' && student) {
      const studentData = await Student.findById(student);
      if (studentData) {
        schoolId = studentData.school;
        console.log('School ID from student:', schoolId);
      }
    }
    
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required. Please select a school first.' });
    }
    
    let existingQuery = { 
      date: new Date(new Date(date).setHours(0, 0, 0, 0)),
      school: schoolId
    };
    
    console.log('Attendee type:', attendeeType);
    console.log('Teacher ID:', teacher);
    
    if (attendeeType === 'teacher' && teacher) {
      console.log('Processing as teacher attendance');
      existingQuery.teacher = teacher;
      existingQuery.attendeeType = 'teacher';
      
      const teacherData = await Teacher.findById(teacher);
      if (!teacherData) {
        console.log('Teacher not found in DB');
        return res.status(400).json({ message: 'Teacher not found' });
      }
      console.log('Teacher found:', teacherData._id);
    } else if (attendeeType === 'student' && student) {
      console.log('Processing as student attendance');
      existingQuery.student = student;
      existingQuery.attendeeType = 'student';
      
      const studentData = await Student.findById(student);
      if (!studentData) {
        console.log('Student not found in DB');
        return res.status(400).json({ message: 'Student not found' });
      }
    } else {
      console.log('Invalid attendee type or missing ID');
      return res.status(400).json({ message: 'Invalid attendee type or missing ID', attendeeType, student, teacher });
    }
    
    // Check if attendance already exists
    const existing = await Attendance.findOne(existingQuery);
    if (existing) {
      existing.status = status;
      existing.remarks = remarks;
      existing.markedBy = req.user._id;
      await existing.save();
      console.log('Updated existing attendance:', existing._id);
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
    
    try {
      await attendance.save();
      console.log('Attendance created successfully:', attendance._id);
      res.status(201).json(attendance);
    } catch (saveError) {
      console.error('Save error:', saveError);
      res.status(400).json({ message: saveError.message });
    }
  } catch (error) {
    console.error('Mark attendance error:', error);
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
