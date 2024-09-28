const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
    },
    contentType: {
        type: String,
        enum: ['text', 'image', 'video', 'audio'],
        default: 'text',
    },
    mediaUrl: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
    },
});

const ChatSchema = new mongoose.Schema({
    chatName: {
        type: String,
        trim: true,
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
    },
    isGroupChat: {
        type: Boolean,
        default: false,
    },
    users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    latestMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
    },
    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    image: [
        {
            type: String,
        }
    ],
    video: [
        {
            type: String,
        }
    ],
    audio: [
        {
            type: String,
        }
    ],
    file: [
        {
            type: String,
        }
    ],
    messages: [MessageSchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isTemporary: {
        type: Boolean,
        default: false,
    },
    messageRequests: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
    },
});

const MessageRequestSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Chat = mongoose.model('Chat', ChatSchema);
const Message = mongoose.model('Message', MessageSchema);
const MessageRequest = mongoose.model('MessageRequest', MessageRequestSchema);

module.exports = { Chat, Message, MessageRequest };
