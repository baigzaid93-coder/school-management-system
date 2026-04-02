const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const { setSchoolFromTenant } = require('../middleware/tenant');
const bulkUploadController = require('../controllers/bulkUploadController');

router.use(authenticate, tenantFilter());

router.post('/students', setSchoolFromTenant, bulkUploadController.bulkUploadStudents);
router.post('/teachers', setSchoolFromTenant, bulkUploadController.bulkUploadTeachers);
router.post('/staff', setSchoolFromTenant, bulkUploadController.bulkUploadStaff);
router.post('/fees', setSchoolFromTenant, bulkUploadController.bulkUploadFees);

module.exports = router;
