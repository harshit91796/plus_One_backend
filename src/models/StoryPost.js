
const mongoose = require('mongoose');

const StoryPostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        required: true
    },
    imageUri: {
        type: String,
        default: null
    },
    date: {
        type: Date,
        default: Date.now
    },
    moodTag: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamps on save
StoryPostSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('StoryPost', StoryPostSchema);