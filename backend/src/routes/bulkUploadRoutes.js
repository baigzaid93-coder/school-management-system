const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const bulkUploadController = require('../controllers/bulkUploadController');

router.use(authenticate, tenantFilter());

router.post('/students', bulkUploadController.bulkUploadStudents);
router.post('/teachers', bulkUploadController.bulkUploadTeachers);
router.post('/staff', bulkUploadController.bulkUploadStaff);
router.post('/fees', bulkUploadController.bulkUploadFees);

module.exports = router;
