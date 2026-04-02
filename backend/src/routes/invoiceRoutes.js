const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { requireSaaSAdmin, requireAuth } = require('../middleware/saasAuth');

router.use(requireAuth);

router.get('/', invoiceController.getAll);
router.get('/school', invoiceController.getBySchool);
router.get('/stats', requireSaaSAdmin, invoiceController.getStats);
router.get('/:id', invoiceController.getById);
router.post('/generate', requireSaaSAdmin, invoiceController.generateMonthlyInvoices);
router.post('/cleanup', requireSaaSAdmin, invoiceController.cleanupOrphanInvoices);
router.post('/delete-all', requireSaaSAdmin, invoiceController.deleteAllInvoices);
router.patch('/:id/paid', invoiceController.markAsPaid);
router.patch('/:id/status', requireSaaSAdmin, invoiceController.updateStatus);
router.patch('/:id/send', invoiceController.sendInvoice);
router.patch('/:id/void', requireSaaSAdmin, invoiceController.voidInvoice);

module.exports = router;
