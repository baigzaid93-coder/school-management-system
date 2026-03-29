const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.use(authenticate, tenantFilter());

router.get('/stats', dashboardController.getDashboardStats);
router.get('/monthly', dashboardController.getMonthlyStats);

module.exports = router;
