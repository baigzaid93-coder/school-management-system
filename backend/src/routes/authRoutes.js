const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize, tenantFilter } = require('../middleware/auth');

router.post('/register', authenticate, tenantFilter(), authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, authController.changePassword);
router.get('/sessions', authenticate, authController.getActiveSessions);

router.get('/people', authenticate, tenantFilter(), authorize('user:view'), authController.getAllPeople);
router.get('/users', authenticate, tenantFilter(), authorize('user:view'), authController.getUsers);
router.get('/users/saas', authenticate, authController.getSaasUsers);
router.put('/users/:id', authenticate, tenantFilter(), authorize('user:edit'), authController.updateUser);
router.delete('/users/:id', authenticate, tenantFilter(), authorize('user:delete'), authController.deleteUser);
router.patch('/users/:id/toggle', authenticate, tenantFilter(), authorize('user:edit'), authController.toggleUserStatus);

module.exports = router;
