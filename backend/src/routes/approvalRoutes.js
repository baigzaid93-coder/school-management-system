const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const { setSchoolFromTenant } = require('../middleware/tenant');
const {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getPendingApprovals,
  getMyPendingApprovals,
  getApprovalById,
  submitForApproval,
  approveRequest,
  rejectRequest,
  cancelRequest,
  escalateRequest,
  getMyRequests,
  getApprovalStats,
  getRoles
} = require('../controllers/approvalController');

router.use(authenticate, tenantFilter());

router.get('/workflows', getWorkflows);
router.post('/workflows', setSchoolFromTenant, createWorkflow);
router.put('/workflows/:id', updateWorkflow);
router.delete('/workflows/:id', deleteWorkflow);

router.get('/pending', getPendingApprovals);
router.get('/my-pending', getMyPendingApprovals);
router.get('/my-requests', getMyRequests);
router.get('/stats', getApprovalStats);
router.get('/roles', getRoles);
router.get('/:id', getApprovalById);

router.post('/submit', setSchoolFromTenant, submitForApproval);
router.post('/:id/approve', approveRequest);
router.post('/:id/reject', rejectRequest);
router.post('/:id/cancel', cancelRequest);
router.post('/:id/escalate', escalateRequest);

module.exports = router;
