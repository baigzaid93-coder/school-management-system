const express = require('express');
const router = express.Router();
const classGradeController = require('../controllers/classGradeController');
const { authenticate, authorize, tenantFilter } = require('../middleware/auth');
const { setSchoolFromTenant } = require('../middleware/tenant');

router.use(authenticate, tenantFilter());

router.get('/', classGradeController.getAll);
router.get('/:id', classGradeController.getById);
router.post('/', authenticate, authorize('course:create'), setSchoolFromTenant, classGradeController.create);
router.put('/:id', authenticate, authorize('course:edit'), classGradeController.update);
router.delete('/:id', authenticate, authorize('course:delete'), classGradeController.delete);

router.get('/:id/students', authenticate, classGradeController.getStudents);
router.post('/:id/students', authenticate, authorize('student:create'), classGradeController.addStudent);
router.delete('/:id/students/:studentId', authenticate, authorize('student:edit'), classGradeController.removeStudent);

router.get('/:id/sections', authenticate, classGradeController.getSections);
router.post('/:id/sections', authenticate, authorize('course:create'), classGradeController.createSection);
router.put('/:id/sections/:sectionId', authenticate, authorize('course:edit'), classGradeController.updateSection);
router.delete('/:id/sections/:sectionId', authenticate, authorize('course:delete'), classGradeController.deleteSection);

router.post('/:id/sections/:sectionId/students', authenticate, authorize('student:edit'), classGradeController.addStudentToSection);
router.delete('/:id/sections/:sectionId/students/:studentId', authenticate, authorize('student:edit'), classGradeController.removeStudentFromSection);

module.exports = router;
