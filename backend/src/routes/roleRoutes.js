const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticate, authorize, tenantFilter } = require('../middleware/auth');

router.use(authenticate, tenantFilter());

router.get('/', roleController.getAll);
router.get('/permissions', roleController.getPermissions);
router.get('/:id', authorize('user:view'), roleController.getById);
router.post('/', authorize('user:create'), roleController.create);
router.put('/:id', authorize('user:edit'), roleController.update);
router.delete('/:id', authorize('user:delete'), roleController.delete);

module.exports = router;
