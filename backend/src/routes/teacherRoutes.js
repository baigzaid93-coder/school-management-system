const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const teacherController = require('../controllers/teacherController');

router.use(authenticate, tenantFilter());

router.get('/', teacherController.getAllTeachers);
router.get('/my-profile', authenticate, teacherController.getMyProfile);
router.get('/:id', authenticate, teacherController.getTeacherById);
router.post('/', authenticate, teacherController.createTeacher);
router.put('/:id', authenticate, teacherController.updateTeacher);
router.delete('/:id', authenticate, teacherController.deleteTeacher);

module.exports = router;
