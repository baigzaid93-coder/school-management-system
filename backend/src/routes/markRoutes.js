const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const controller = require('../controllers/markController');

router.use(authenticate, tenantFilter());

router.get('/', controller.getAll);
router.get('/student/:studentId', controller.getByStudent);
router.get('/exam/:examId', controller.getByExam);
router.get('/report-card', controller.getReportCard);
router.post('/', controller.create);
router.post('/bulk', controller.bulkCreate);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
