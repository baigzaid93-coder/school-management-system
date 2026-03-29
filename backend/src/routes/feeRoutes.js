const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const feeController = require('../controllers/feeController');

router.use(authenticate, tenantFilter());

router.get('/', feeController.getAllFees);
router.get('/family', feeController.getFamilyVouchers);
router.get('/family/:familyNumber', authenticate, feeController.getFamilyVouchersByNumber);
router.get('/student/:studentId', authenticate, feeController.getFeesByStudent);
router.get('/summary', authenticate, feeController.getFeeSummary);
router.post('/', authenticate, feeController.createFee);
router.post('/suggested-fees', authenticate, feeController.getSuggestedFees);
router.post('/calculate-monthly', authenticate, feeController.calculateMonthlyFees);
router.put('/:id', authenticate, feeController.updateFee);
router.post('/:id/payment', authenticate, feeController.recordPayment);
router.delete('/:id', authenticate, feeController.deleteFee);

module.exports = router;
