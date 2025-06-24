const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateUser } = require('../middleware/authMiddleware');

// Apply authentication middleware to all settings routes
router.use(authenticateUser);

// Get all user settings
router.get('/', settingsController.getUserSettings);

// Privacy settings
router.put('/privacy', settingsController.updatePrivacySettings);

// Notification settings
router.put('/notifications', settingsController.updateNotificationSettings);

// Preferences
router.put('/preferences', settingsController.updatePreferences);

// Security settings
router.put('/security', settingsController.updateSecuritySettings);
router.post('/security/login', settingsController.logNewLogin);

// Blocked & muted users
router.get('/blocked', settingsController.getBlockedUsers);
router.post('/blocked', settingsController.manageBlockedUsers);
router.get('/muted', settingsController.getMutedUsers);
router.post('/muted', settingsController.manageMutedUsers);

// Data export
router.post('/data-export', settingsController.requestDataExport);

// Account deletion - typically requires additional security measures
router.post('/delete-account', settingsController.deleteAccount);

module.exports = router; 