const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const { authenticate, isAuthenticated, isSuperAdmin } = require('../middleware/auth');

router.use(authenticate);

router.get('/', isAuthenticated, schoolController.getAll);
router.get('/:id', isAuthenticated, schoolController.getById);
router.post('/', isSuperAdmin, schoolController.create);
router.put('/:id', isSuperAdmin, schoolController.update);
router.patch('/:id/modules', isSuperAdmin, schoolController.updateModules);
router.patch('/:id/subscription', isSuperAdmin, schoolController.updateSubscription);
router.get('/:id/stats', isAuthenticated, schoolController.getStats);
router.delete('/:id', isSuperAdmin, schoolController.delete);

module.exports = router;
