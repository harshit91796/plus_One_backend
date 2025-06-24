const mongoose = require('mongoose');

const PhotoGallerySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    photos: [{
        id: {
            type: String,
            required: true
        },
        uri: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ''
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
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
PhotoGallerySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('PhotoGallery', PhotoGallerySchema);