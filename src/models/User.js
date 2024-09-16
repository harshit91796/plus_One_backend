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
    followers: {
        type: Array,
        default: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    following: {
        type: Array,
        default: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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
