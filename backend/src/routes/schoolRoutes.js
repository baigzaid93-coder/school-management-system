const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const { requireSaaSAdmin, requireAuth } = require('../middleware/saasAuth');

router.use(requireAuth);

router.get('/', schoolController.getAll);
router.get('/:id', schoolController.getById);
router.post('/', requireSaaSAdmin, schoolController.create);
router.put('/:id', requireSaaSAdmin, schoolController.update);
router.patch('/:id/modules', requireSaaSAdmin, schoolController.updateModules);
router.patch('/:id/subscription', requireSaaSAdmin, schoolController.updateSubscription);
router.get('/:id/stats', requireSaaSAdmin, schoolController.getStats);
router.delete('/:id', requireSaaSAdmin, schoolController.delete);

module.exports = router;
