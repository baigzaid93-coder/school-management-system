const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

router.use(authenticate);
router.use(tenantFilter());

router.get('/', attendanceController.getAllAttendance);
router.get('/student/:studentId', attendanceController.getAttendanceByStudent);
router.get('/teacher/:teacherId', attendanceController.getAttendanceByTeacher);
router.get('/course/:courseId', attendanceController.getAttendanceByCourse);
router.get('/stats', attendanceController.getAttendanceStats);
router.post('/mark', attendanceController.markAttendance);
router.post('/bulk', attendanceController.bulkMarkAttendance);

module.exports = router;
