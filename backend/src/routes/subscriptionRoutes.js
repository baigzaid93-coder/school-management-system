const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { requireSaaSAdmin, requireAuth } = require('../middleware/saasAuth');

router.use(requireAuth);

router.get('/plans', subscriptionController.getPlans);
router.get('/current', subscriptionController.getSchoolSubscription);
router.get('/usage', subscriptionController.checkUsage);
router.get('/billing', subscriptionController.getBillingHistory);
router.get('/check-access', subscriptionController.checkAccess);
router.patch('/plan', subscriptionController.updatePlan);
router.patch('/cancel', subscriptionController.cancelSubscription);
router.get('/all', requireSaaSAdmin, subscriptionController.getAllSubscriptions);
router.patch('/school/:schoolId', requireSaaSAdmin, subscriptionController.updateSubscriptionByAdmin);

module.exports = router;
