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
        type: {type: String, enum: ['Point'], default: 'Point'},
        coordinates: {type: [Number], required: true},
        formatted: {type: String, required: true}
    },
    date: {
        type: String,
        required: true,
    },
    peopleNeeded: {
        type: Number,
        required: true,
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
});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;
