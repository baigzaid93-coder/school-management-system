const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const admissionPDFController = require('../controllers/admissionPDFController');

router.use(authenticate, tenantFilter());

router.get('/pending-count', admissionPDFController.getPendingCount);
router.get('/:id/pdf', admissionPDFController.generateAdmissionPDF);

module.exports = router;
