const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const controller = require('../controllers/enrollmentController');

router.use(authenticate, tenantFilter());

router.get('/', controller.getAll);
router.get('/student/:studentId', controller.getByStudent);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.post('/promote', controller.promoteStudents);

module.exports = router;
