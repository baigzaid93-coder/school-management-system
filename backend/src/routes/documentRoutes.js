const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const controller = require('../controllers/documentController');

router.use(authenticate, tenantFilter());

router.get('/', controller.getAll);
router.post('/', controller.upload);
router.patch('/:id/verify', controller.verify);
router.delete('/:id', controller.delete);

module.exports = router;
