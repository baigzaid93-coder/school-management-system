const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const { setSchoolFromTenant } = require('../middleware/tenant');
const {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  resolveIncident,
  getWarnings,
  createWarning,
  acknowledgeWarning,
  getActions,
  createAction,
  completeAction,
  getNotifications,
  createNotification,
  updateNotificationResponse,
  getStudentDisciplineHistory,
  getDisciplineStats,
  incidentTypes,
  actionTypes
} = require('../controllers/disciplineController');

router.use(authenticate, tenantFilter());

router.get('/stats', getDisciplineStats);
router.get('/incident-types', (req, res) => res.json(incidentTypes));
router.get('/action-types', (req, res) => res.json(actionTypes));

router.get('/incidents', getIncidents);
router.get('/incidents/:id', getIncidentById);
router.post('/incidents', setSchoolFromTenant, createIncident);
router.put('/incidents/:id', updateIncident);
router.patch('/incidents/:id/resolve', resolveIncident);

router.get('/warnings', getWarnings);
router.post('/warnings', setSchoolFromTenant, createWarning);
router.patch('/warnings/:id/acknowledge', acknowledgeWarning);

router.get('/actions', getActions);
router.post('/actions', setSchoolFromTenant, createAction);
router.patch('/actions/:id/complete', completeAction);

router.get('/notifications', getNotifications);
router.post('/notifications', setSchoolFromTenant, createNotification);
router.patch('/notifications/:id/response', updateNotificationResponse);

router.get('/student/:studentId/history', getStudentDisciplineHistory);

module.exports = router;
