const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const voucherController = require('../controllers/voucherController');

router.use(authenticate, tenantFilter());

router.get('/:id/pdf', voucherController.generateVoucherPDF);
router.get('/:id', voucherController.getVoucherPreview);

module.exports = router;
