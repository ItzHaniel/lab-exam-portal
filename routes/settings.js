const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Settings API routes
router.post('/update-profile', settingsController.updateProfile);
router.post('/change-password', settingsController.changePassword);
router.post('/upload-avatar', settingsController.uploadAvatar); // Now handles middleware internally
router.post('/update-notifications', settingsController.updateNotifications);
router.post('/update-preferences', settingsController.updatePreferences);

module.exports = router;
