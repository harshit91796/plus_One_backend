const Settings = require('../models/Settings');
const User = require('../models/User');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Get user settings
const getUserSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const settings = await Settings.findOrCreateByUserId(userId);
    
    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({
      success: false,
      error: 'Error retrieving settings',
      details: error.message
    });
  }
};

// Update privacy settings
const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { profileVisibility, postVisibility, locationSharing, onlineStatus, activityStatus } = req.body;
    
    // Find or create settings
    let settings = await Settings.findOrCreateByUserId(userId);
    
    // Update only provided fields
    if (profileVisibility !== undefined) {
      settings.privacy.profileVisibility = profileVisibility;
    }
    
    if (postVisibility !== undefined) {
      settings.privacy.postVisibility = postVisibility;
    }
    
    if (locationSharing !== undefined) {
      settings.privacy.locationSharing = locationSharing;
    }
    
    if (onlineStatus !== undefined) {
      settings.privacy.onlineStatus = onlineStatus;
    }
    
    if (activityStatus !== undefined) {
      settings.privacy.activityStatus = activityStatus;
    }
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully',
      settings: settings.privacy
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating privacy settings',
      details: error.message
    });
  }
};

// Update notification settings
const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { push, email } = req.body;
    
    let settings = await Settings.findOrCreateByUserId(userId);
    
    // Update push notification settings
    if (push) {
      if (push.enabled !== undefined) settings.notifications.push.enabled = push.enabled;
      if (push.newMessages !== undefined) settings.notifications.push.newMessages = push.newMessages;
      if (push.postRequests !== undefined) settings.notifications.push.postRequests = push.postRequests;
      if (push.newFollowers !== undefined) settings.notifications.push.newFollowers = push.newFollowers;
      if (push.postComments !== undefined) settings.notifications.push.postComments = push.postComments;
    }
    
    // Update email notification settings
    if (email) {
      if (email.enabled !== undefined) settings.notifications.email.enabled = email.enabled;
      if (email.newMessages !== undefined) settings.notifications.email.newMessages = email.newMessages;
      if (email.postRequests !== undefined) settings.notifications.email.postRequests = email.postRequests;
      if (email.newFollowers !== undefined) settings.notifications.email.newFollowers = email.newFollowers;
      if (email.postComments !== undefined) settings.notifications.email.postComments = email.postComments;
      if (email.marketing !== undefined) settings.notifications.email.marketing = email.marketing;
    }
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      settings: settings.notifications
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating notification settings',
      details: error.message
    });
  }
};

// Update preferences
const updatePreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const { theme, language, timezone } = req.body;
    
    let settings = await Settings.findOrCreateByUserId(userId);
    
    if (theme !== undefined) {
      settings.preferences.theme = theme;
    }
    
    if (language !== undefined) {
      settings.preferences.language = language;
    }
    
    if (timezone !== undefined) {
      settings.preferences.timezone = timezone;
    }
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      settings: settings.preferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating preferences',
      details: error.message
    });
  }
};

// Update security settings
const updateSecuritySettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { twoFactorAuth } = req.body;
    
    let settings = await Settings.findOrCreateByUserId(userId);
    
    if (twoFactorAuth) {
      if (twoFactorAuth.enabled !== undefined) {
        settings.security.twoFactorAuth.enabled = twoFactorAuth.enabled;
      }
      
      if (twoFactorAuth.method !== undefined) {
        settings.security.twoFactorAuth.method = twoFactorAuth.method;
      }
    }
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Security settings updated successfully',
      settings: settings.security
    });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating security settings',
      details: error.message
    });
  }
};

// Log a new login for security tracking
const logNewLogin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { device, location, ip } = req.body;
    
    let settings = await Settings.findOrCreateByUserId(userId);
    
    // Add new login to recent logins
    settings.security.recentLogins.push({
      device,
      location,
      ip,
      timestamp: new Date()
    });
    
    // Keep only the most recent 10 logins
    if (settings.security.recentLogins.length > 10) {
      settings.security.recentLogins = settings.security.recentLogins.slice(-10);
    }
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Login logged successfully'
    });
  } catch (error) {
    console.error('Error logging login:', error);
    res.status(500).json({
      success: false,
      error: 'Error logging login',
      details: error.message
    });
  }
};

// Manage blocked users
const manageBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { action, targetUserId } = req.body;
    
    if (!targetUserId || !ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid target user ID'
      });
    }
    
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Target user not found'
      });
    }
    
    let settings = await Settings.findOrCreateByUserId(userId);
    
    if (action === 'block') {
      // Check if user is already blocked
      if (!settings.blocked.users.includes(targetUserId)) {
        settings.blocked.users.push(targetUserId);
        
        // Also remove from muted if they're there
        settings.muted.users = settings.muted.users.filter(id => 
          id.toString() !== targetUserId.toString()
        );
      }
    } else if (action === 'unblock') {
      settings.blocked.users = settings.blocked.users.filter(id => 
        id.toString() !== targetUserId.toString()
      );
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action, must be "block" or "unblock"'
      });
    }
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: `User ${action === 'block' ? 'blocked' : 'unblocked'} successfully`,
      blockedUsers: settings.blocked.users
    });
  } catch (error) {
    console.error('Error managing blocked users:', error);
    res.status(500).json({
      success: false,
      error: 'Error managing blocked users',
      details: error.message
    });
  }
};

// Manage muted users
const manageMutedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { action, targetUserId } = req.body;
    
    if (!targetUserId || !ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid target user ID'
      });
    }
    
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Target user not found'
      });
    }
    
    let settings = await Settings.findOrCreateByUserId(userId);
    
    if (action === 'mute') {
      // Can't mute a blocked user
      if (settings.blocked.users.some(id => id.toString() === targetUserId.toString())) {
        return res.status(400).json({
          success: false,
          error: 'Cannot mute a blocked user. Unblock the user first.'
        });
      }
      
      // Check if user is already muted
      if (!settings.muted.users.includes(targetUserId)) {
        settings.muted.users.push(targetUserId);
      }
    } else if (action === 'unmute') {
      settings.muted.users = settings.muted.users.filter(id => 
        id.toString() !== targetUserId.toString()
      );
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action, must be "mute" or "unmute"'
      });
    }
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: `User ${action === 'mute' ? 'muted' : 'unmuted'} successfully`,
      mutedUsers: settings.muted.users
    });
  } catch (error) {
    console.error('Error managing muted users:', error);
    res.status(500).json({
      success: false,
      error: 'Error managing muted users',
      details: error.message
    });
  }
};

// Request data export
const requestDataExport = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let settings = await Settings.findOrCreateByUserId(userId);
    
    // Only allow a new export if previous one is not processing
    if (settings.dataExport.status === 'processing') {
      return res.status(400).json({
        success: false,
        error: 'You already have a data export in progress'
      });
    }
    
    settings.dataExport.lastRequested = new Date();
    settings.dataExport.status = 'processing';
    
    await settings.save();
    
    // In a real application, you would trigger a background job here to generate the export
    
    res.status(200).json({
      success: true,
      message: 'Data export requested successfully',
      estimatedCompletion: '24 hours'
    });
  } catch (error) {
    console.error('Error requesting data export:', error);
    res.status(500).json({
      success: false,
      error: 'Error requesting data export',
      details: error.message
    });
  }
};

// Get blocked users with details
const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let settings = await Settings.findOrCreateByUserId(userId);
    
    // Populate user details for blocked users
    const populatedSettings = await Settings.findById(settings._id)
      .populate('blocked.users', 'name profilePic');
    
    res.status(200).json({
      success: true,
      blockedUsers: populatedSettings.blocked.users
    });
  } catch (error) {
    console.error('Error getting blocked users:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting blocked users',
      details: error.message
    });
  }
};

// Get muted users with details
const getMutedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let settings = await Settings.findOrCreateByUserId(userId);
    
    // Populate user details for muted users
    const populatedSettings = await Settings.findById(settings._id)
      .populate('muted.users', 'name profilePic');
    
    res.status(200).json({
      success: true,
      mutedUsers: populatedSettings.muted.users
    });
  } catch (error) {
    console.error('Error getting muted users:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting muted users',
      details: error.message
    });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { password } = req.body;
    
    // In a real application, you would verify the password here
    
    // Delete the user's settings
    await Settings.findOneAndDelete({ user: userId });
    
    // Delete the user's account (or anonymize it, depending on your requirements)
    await User.findByIdAndDelete(userId);
    
    // In a real application, you might want to delete or anonymize other user data too
    
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting account',
      details: error.message
    });
  }
};

module.exports = {
  getUserSettings,
  updatePrivacySettings,
  updateNotificationSettings,
  updatePreferences,
  updateSecuritySettings,
  logNewLogin,
  manageBlockedUsers,
  manageMutedUsers,
  requestDataExport,
  getBlockedUsers,
  getMutedUsers,
  deleteAccount
}; 