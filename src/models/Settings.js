const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    },
    postVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    },
    locationSharing: {
      type: Boolean,
      default: true
    },
    onlineStatus: {
      type: String,
      enum: ['everyone', 'friends', 'nobody'],
      default: 'everyone'
    },
    activityStatus: {
      type: Boolean,
      default: true
    }
  },
  notifications: {
    push: {
      enabled: { type: Boolean, default: true },
      newMessages: { type: Boolean, default: true },
      postRequests: { type: Boolean, default: true },
      newFollowers: { type: Boolean, default: true },
      postComments: { type: Boolean, default: true }
    },
    email: {
      enabled: { type: Boolean, default: true },
      newMessages: { type: Boolean, default: false },
      postRequests: { type: Boolean, default: true },
      newFollowers: { type: Boolean, default: false },
      postComments: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false }
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  security: {
    twoFactorAuth: {
      enabled: { type: Boolean, default: false },
      method: { type: String, enum: ['app', 'sms', 'email'], default: 'sms' }
    },
    recentLogins: [{
      device: { type: String },
      location: { type: String },
      ip: { type: String },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  blocked: {
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  muted: {
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  dataExport: {
    lastRequested: { type: Date },
    status: { type: String, enum: ['none', 'processing', 'ready', 'downloaded'], default: 'none' }
  }
}, { timestamps: true });

// Create settings for a user if they don't exist
settingsSchema.statics.findOrCreateByUserId = async function(userId) {
  let settings = await this.findOne({ user: userId });
  
  if (!settings) {
    settings = await this.create({ user: userId });
  }
  
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings; 