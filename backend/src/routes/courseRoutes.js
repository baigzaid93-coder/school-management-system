const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const courseController = require('../controllers/courseController');

router.use(authenticate, tenantFilter());

router.get('/', courseController.getAllCourses);
router.get('/:id', authenticate, courseController.getCourseById);
router.post('/', authenticate, courseController.createCourse);
router.put('/:id', authenticate, courseController.updateCourse);
router.delete('/:id', authenticate, courseController.deleteCourse);
router.post('/:id/students', authenticate, courseController.addStudentToCourse);

module.exports = router;
