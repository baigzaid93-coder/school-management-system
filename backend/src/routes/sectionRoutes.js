const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const { setSchoolFromTenant } = require('../middleware/tenant');
const controller = require('../controllers/sectionController');

router.use(authenticate, tenantFilter());

router.get('/', controller.getAll);
router.get('/class/:classId', controller.getByClass);
router.post('/', setSchoolFromTenant, controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
