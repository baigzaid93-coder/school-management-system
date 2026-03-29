const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const controller = require('../controllers/schoolProfileController');

router.use(authenticate, tenantFilter());

router.get('/', controller.getProfile);
router.put('/', controller.updateProfile);

module.exports = router;
