const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const { setSchoolFromTenant } = require('../middleware/tenant');
const controller = require('../controllers/parentController');

router.use(authenticate, tenantFilter());

router.get('/', controller.getAll);
router.get('/my-profile', authenticate, controller.getMyProfile);
router.get('/:id', controller.getById);
router.post('/', setSchoolFromTenant, controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
