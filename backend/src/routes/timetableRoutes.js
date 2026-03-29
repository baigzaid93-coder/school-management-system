const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const controller = require('../controllers/timetableController');

router.use(authenticate, tenantFilter());

router.get('/', controller.getAll);
router.get('/class/:classId', controller.getByClass);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.patch('/:id/activate', controller.activate);

module.exports = router;
