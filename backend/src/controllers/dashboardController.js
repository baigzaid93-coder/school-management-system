const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');

exports.getDashboardStats = async (req, res) => {
  try {
    const tenantQuery = req.tenantQuery || {};

    const [
      totalStudents,
      totalTeachers,
      totalCourses,
      recentStudents,
      attendanceToday,
      pendingFees
    ] = await Promise.all([
      Student.countDocuments({ ...tenantQuery, status: 'Active' }),
      Teacher.countDocuments({ ...tenantQuery, status: 'Active' }),
      Course.countDocuments({ ...tenantQuery, status: 'Active' }),
      Student.find(tenantQuery).sort({ createdAt: -1 }).limit(5),
      Attendance.countDocuments({ 
        ...tenantQuery,
        date: { $gte: new Date().setHours(0, 0, 0, 0), $lte: new Date().setHours(23, 59, 59, 999) }
      }),
      Fee.countDocuments({ ...tenantQuery, status: { $in: ['Pending', 'Partial', 'Overdue'] } })
    ]);

    const gradeMatch = { ...tenantQuery };
    const gradeStats = await Grade.aggregate([
      { $match: gradeMatch },
      {
        $group: {
          _id: null,
          average: { $avg: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] } }
        }
      }
    ]);

    res.json({
      totalStudents,
      totalTeachers,
      totalCourses,
      recentStudents,
      attendanceToday,
      pendingFees,
      averageGrade: gradeStats[0]?.average?.toFixed(2) || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMonthlyStats = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    const tenantQuery = req.tenantQuery || {};

    const monthlyData = await Promise.all([
      Student.aggregate([
        {
          $match: {
            ...tenantQuery,
            admissionDate: {
              $gte: new Date(`${currentYear}-01-01`),
              $lte: new Date(`${currentYear}-12-31`)
            }
          }
        },
        {
          $group: {
            _id: { $month: '$admissionDate' },
            count: { $sum: 1 }
          }
        }
      ]),
      Fee.aggregate([
        {
          $match: {
            ...tenantQuery,
            createdAt: {
              $gte: new Date(`${currentYear}-01-01`),
              $lte: new Date(`${currentYear}-12-31`)
            }
          }
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            total: { $sum: '$amount' },
            collected: { $sum: '$paidAmount' }
          }
        }
      ])
    ]);

    res.json({
      enrollments: monthlyData[0],
      fees: monthlyData[1]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
