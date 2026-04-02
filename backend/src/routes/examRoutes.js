const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const { setSchoolFromTenant } = require('../middleware/tenant');
const controller = require('../controllers/examController');

router.use(authenticate, tenantFilter());

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', setSchoolFromTenant, controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.patch('/:id/publish', controller.publishResults);

module.exports = router;
