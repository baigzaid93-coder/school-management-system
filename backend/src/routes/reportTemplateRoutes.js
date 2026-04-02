const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const {
  getAvailableFields,
  getAllEntityTypes,
  getAllReportTemplates,
  getReportTemplate,
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
  duplicateReportTemplate,
  getReportData
} = require('../controllers/reportTemplateController');

router.use(authenticate, tenantFilter());

router.get('/fields/:entityType', getAvailableFields);
router.get('/entity-types', getAllEntityTypes);
router.get('/', getAllReportTemplates);
router.get('/:id', getReportTemplate);
router.post('/', createReportTemplate);
router.put('/:id', updateReportTemplate);
router.delete('/:id', deleteReportTemplate);
router.post('/:id/duplicate', duplicateReportTemplate);
router.post('/:id/execute', getReportData);

module.exports = router;
