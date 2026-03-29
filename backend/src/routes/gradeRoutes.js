const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const gradeController = require('../controllers/gradeController');

router.use(authenticate, tenantFilter());

router.get('/', gradeController.getAllGrades);
router.get('/teacher/all', authenticate, gradeController.getTeacherGrades);
router.get('/student/:studentId', authenticate, gradeController.getGradesByStudent);
router.get('/student/:studentId/average', authenticate, gradeController.getStudentAverage);
router.get('/course/:courseId', authenticate, gradeController.getGradesByCourse);
router.post('/', authenticate, gradeController.createGrade);
router.put('/:id', authenticate, gradeController.updateGrade);
router.delete('/:id', authenticate, gradeController.deleteGrade);

module.exports = router;
