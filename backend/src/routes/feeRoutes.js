const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const { setSchoolFromTenant } = require('../middleware/tenant');
const feeController = require('../controllers/feeController');

router.use(authenticate, tenantFilter());

router.get('/', feeController.getAllFees);
router.get('/family', feeController.getFamilyVouchers);
router.get('/family/:familyNumber', authenticate, feeController.getFamilyVouchersByNumber);
router.get('/student/:studentId', authenticate, feeController.getFeesByStudent);
router.get('/summary', authenticate, feeController.getFeeSummary);
router.get('/concessions/pending', authenticate, feeController.getPendingConcessions);
router.post('/', authenticate, setSchoolFromTenant, feeController.createFee);
router.post('/suggested-fees', authenticate, feeController.getSuggestedFees);
router.post('/calculate-monthly', authenticate, feeController.calculateMonthlyFees);
router.put('/:id', authenticate, feeController.updateFee);
router.post('/:id/payment', authenticate, feeController.recordPayment);
router.post('/:id/concession', authenticate, setSchoolFromTenant, feeController.requestConcession);
router.post('/:id/concession/approve', authenticate, feeController.approveConcession);
router.post('/:id/concession/reject', authenticate, feeController.rejectConcession);
router.delete('/:id', authenticate, feeController.deleteFee);
router.post('/cleanup-orphans', authenticate, feeController.cleanupOrphanFees);

module.exports = router;
