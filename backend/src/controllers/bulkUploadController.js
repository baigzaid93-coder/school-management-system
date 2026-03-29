const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Staff = require('../models/Staff');
const Fee = require('../models/Fee');
const ClassGrade = require('../models/ClassGrade');
const Section = require('../models/Section');
const User = require('../models/User');
const Role = require('../models/Role');
const { generateStudentId, generateTeacherId, generateStaffMemberId } = require('../utils/idGenerator');

exports.bulkUploadStudents = async (req, res) => {
  try {
    const schoolId = req.tenantQuery?.school || req.user?.school;
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }

    const students = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'No data provided' });
    }

    const studentRole = await Role.findOne({ code: 'STUDENT' });
    const errors = [];
    let success = 0;

    for (let i = 0; i < students.length; i++) {
      const data = students[i];
      try {
        let assignedClass = null;
        if (data.classGrade || data.assignedClass) {
          const className = data.classGrade || data.assignedClass;
          assignedClass = await ClassGrade.findOne({ 
            school: schoolId, 
            name: { $regex: new RegExp(className, 'i') } 
          });
        }

        let section = null;
        if (data.section) {
          section = await Section.findOne({ 
            school: schoolId, 
            name: { $regex: new RegExp(data.section, 'i') } 
          });
        }

        const studentId = await generateStudentId(schoolId);
        const student = new Student({
          studentId,
          firstName: data.firstName || 'Student',
          lastName: data.lastName || '',
          fatherName: data.fatherName || data.parentName || '',
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date('2010-01-01'),
          gender: data.gender || 'Male',
          phone: data.phone || '',
          email: data.email || '',
          address: {
            street: data.address || '',
            city: data.city || '',
          },
          classGrade: assignedClass?._id,
          section: section?._id,
          school: schoolId,
          status: 'Active',
          admissionDate: new Date()
        });

        await student.save();

        const firstName = student.firstName;
        const username = `${firstName.toLowerCase()}.${studentId.toLowerCase()}`;
        const defaultPassword = `student${firstName.toLowerCase()}123`;

        if (!data.email) {
          const user = new User({
            username,
            email: `${studentId.toLowerCase()}@school.edu`,
            password: defaultPassword,
            role: studentRole._id,
            school: schoolId,
            profile: {
              firstName: student.firstName,
              lastName: student.lastName,
              phone: student.phone
            },
            studentId: student._id
          });
          await user.save();
          student.userId = user._id;
          await student.save();
        }

        success++;
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: `Uploaded ${success} students`,
      success,
      failed: students.length - success,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bulkUploadTeachers = async (req, res) => {
  try {
    const schoolId = req.tenantQuery?.school || req.user?.school;
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }

    const teachers = req.body;
    if (!Array.isArray(teachers) || teachers.length === 0) {
      return res.status(400).json({ message: 'No data provided' });
    }

    const teacherRole = await Role.findOne({ code: 'TEACHER' });
    const errors = [];
    let success = 0;

    for (let i = 0; i < teachers.length; i++) {
      const data = teachers[i];
      try {
        const teacherId = await generateTeacherId(schoolId);
        const subjects = data.subjects ? data.subjects.split(',').map(s => s.trim()) : [];

        const teacher = new Teacher({
          teacherId,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          fatherName: data.fatherName || '',
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date('1990-01-01'),
          gender: data.gender || 'Male',
          phone: data.phone || '',
          email: data.email || `${teacherId}@school.edu`,
          qualification: data.qualification || '',
          subjects,
          salary: data.salary || 0,
          school: schoolId,
          status: 'Active',
          hireDate: new Date()
        });

        await teacher.save();

        if (data.email) {
          const username = `${data.firstName?.toLowerCase()}.${data.lastName?.toLowerCase()}`;
          const defaultPassword = `teacher${data.firstName?.toLowerCase()}123`;

          const user = new User({
            username,
            email: data.email,
            password: defaultPassword,
            role: teacherRole._id,
            school: schoolId,
            profile: {
              firstName: teacher.firstName,
              lastName: teacher.lastName,
              phone: teacher.phone
            },
            teacherId: teacher._id
          });
          await user.save();
          teacher.userId = user._id;
          await teacher.save();
        }

        success++;
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: `Uploaded ${success} teachers`,
      success,
      failed: teachers.length - success,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bulkUploadStaff = async (req, res) => {
  try {
    const schoolId = req.tenantQuery?.school || req.user?.school;
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }

    const staffMembers = req.body;
    if (!Array.isArray(staffMembers) || staffMembers.length === 0) {
      return res.status(400).json({ message: 'No data provided' });
    }

    const errors = [];
    let success = 0;

    for (let i = 0; i < staffMembers.length; i++) {
      const data = staffMembers[i];
      try {
        const staffId = await generateStaffMemberId(schoolId);

        const staff = new Staff({
          staffId,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          fatherName: data.fatherName || '',
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date('1985-01-01'),
          gender: data.gender || 'Male',
          phone: data.phone || '',
          email: data.email || `${staffId}@school.edu`,
          designation: data.designation || '',
          department: data.department || '',
          salary: {
            basic: data.salary || 0,
            allowances: 0,
            deductions: 0
          },
          school: schoolId,
          status: 'Active',
          dateOfJoining: new Date()
        });

        await staff.save();
        success++;
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: `Uploaded ${success} staff members`,
      success,
      failed: staffMembers.length - success,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bulkUploadFees = async (req, res) => {
  try {
    const schoolId = req.tenantQuery?.school || req.user?.school;
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }

    const fees = req.body;
    if (!Array.isArray(fees) || fees.length === 0) {
      return res.status(400).json({ message: 'No data provided' });
    }

    const errors = [];
    let success = 0;

    for (let i = 0; i < fees.length; i++) {
      const data = fees[i];
      try {
        const student = await Student.findOne({ 
          school: schoolId, 
          studentId: data.studentId 
        });

        if (!student) {
          errors.push(`Row ${i + 1}: Student not found with ID ${data.studentId}`);
          continue;
        }

        const fee = new Fee({
          student: student._id,
          school: schoolId,
          feeType: data.feeType || 'Other',
          amount: data.amount || 0,
          paidAmount: 0,
          dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
          academicYear: data.academicYear || new Date().getFullYear().toString(),
          term: data.term || '1',
          description: data.description || '',
          status: 'Pending'
        });

        await fee.save();
        success++;
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({
      message: `Uploaded ${success} fee records`,
      success,
      failed: fees.length - success,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
