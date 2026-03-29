const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const controller = require('../controllers/leaveController');

router.use(authenticate, tenantFilter());

router.get('/', controller.getAll);
router.get('/staff/:staffId', controller.getByStaff);
router.post('/', controller.create);
router.patch('/:id/approve', controller.approve);
router.patch('/:id/reject', controller.reject);
router.patch('/:id/cancel', controller.cancel);

module.exports = router;
