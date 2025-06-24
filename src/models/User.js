// /models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    // username: {
    //     type: String,
    //     // required: true,
    //     unique: true,
    // },

    name : {
      type: String,
    //   required: true,
    },
    age : {
        type: Number,
        // required: true,
    },
    email: {
        type: String,
        // required: true,
        unique: true,
    },
    gender: {
        type: String,
        // required: true,
    },
    password: {
        type: String,
        // required: true,
    },
    profilePic: {
        type: String,
        default: '',
    },
    coverPic: {
        type: String,
        default: '',
    },
    followers: {
        type: Array,
        default: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    following: {
        type: Array,
        default: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    messageRequestsSent: {
        type: Array,
        default: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MessageRequest' }],
    },
    messageRequestsReceived: {
        type: Array,
        default: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MessageRequest' }],
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    intersts: [String],
    zodiac: [String],
    religion: [String],
    dietaryPreferences: [String],
    launguages: [String],
    musicPrefrence: [String],
    moviePrefrence: [String],
    sportsPrefrence: [String],
    petPrefrence: [String],
    drinkingPrefrence: [String],
    smokingPrefrence: [String],
    trevelPrefrence: [String],
    statePrefrence: [String],
    agePrefrence: [String],
    socialmediaPresence: [String],
    sleepingHabits: [String],
    athlaticPrefrence: [String],
    workPrefrence: [String],

    resetPasswordToken: String,
    resetPasswordExpire: Date,
    date: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    hashtags: {
    type: [String],
    default: [],
    },
    personalityTraits: {
        extraversion: { type: Number, default: 0 },
        openness: { type: Number, default: 0 },
        conscientiousness: { type: Number, default: 0 },
        agreeableness: { type: Number, default: 0 },
        emotionalStability: { type: Number, default: 0 },
        adaptability: { type: Number, default: 0 },
        resilience: { type: Number, default: 0 }
      },
      password: { type: String, required: true },
      responses: [{
        questionId: String,
        answer: String,
        responseTime: Number
      }],
      assessmentCompleted: { type: Boolean, default: false },
      assessmentProgress: {
        type: Number,
        default: 0
      },
      resultData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      },

        // NEW FIELDS FOR PROFILE FEATURES
    location: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    // Introduction story embedded directly in user model
    introStory: {
        profileQuote: {
            type: String,
            default: ''
        },
        personalDescription: {
            type: String,
            default: ''
        },
        tags: {
            type: [String],
            default: []
        }
    },
    
    // References to separate collections
    storyPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StoryPost'
    }],
    photoGallery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PhotoGallery'
    }
});

// Hash the password before saving the user
UserSchema.pre('save', async function(next) {
    console.log(this.password);
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.generateResetToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
