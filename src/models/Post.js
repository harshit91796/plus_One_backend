const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    image: [{imageUrl: String , imageDescription: String}],
    description: {
        type: String,
        required: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: [Number], // This should be an array of numbers, not objects
        formatted: String
    },
    checkpoints : [],
    
    date: {
        type: String,
        required: true,
    },
    startTime: {
        type: String,
        // required: true,
    },
    endTime: {
        type: String,
        // required: true,
    },
    peopleNeeded: {
        type: Number,
        required: true,
    },
    maleNeeded: {
        type: Number,
        // required: true,
    },
    femaleNeeded: {
        type: Number,
        // required: true,
    },
    budget: {
        tier: String,
        min: Number,
        max: Number,
    },
    transport: {
        type: String,
        enum: ['car','bike','flight',"publictransport","hitchhike"],
    },
    public: {
        type: Boolean,
        default: false,
    },
    requests: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        },
    ],
    groupChat: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    groupChatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    hashtags: {
    type: [String],
    default: [],
    index: true // for faster search
    }

}, { timestamps: true });

// Add a 2dsphere index for geospatial queries
PostSchema.index({ "location": "2dsphere" });

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;
