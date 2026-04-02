const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const { setSchoolFromTenant } = require('../middleware/tenant');
const studentController = require('../controllers/studentController');

router.use(authenticate, tenantFilter());

router.get('/', studentController.getAllStudents);
router.get('/my-profile', authenticate, studentController.getMyProfile);
router.get('/search', authenticate, studentController.searchStudents);
router.get('/siblings/:studentId', studentController.getSiblingsByFamily);
router.get('/pending', studentController.getPendingAdmissions);
router.get('/all', studentController.getAllAdmissions);
router.get('/:id', authenticate, studentController.getStudentById);
router.post('/', authenticate, setSchoolFromTenant, studentController.createStudent);
router.put('/:id', authenticate, studentController.updateStudent);
router.delete('/:id', authenticate, studentController.deleteStudent);
router.post('/:id/approve', studentController.approveAdmission);
router.post('/:id/reject', studentController.rejectAdmission);

module.exports = router;
