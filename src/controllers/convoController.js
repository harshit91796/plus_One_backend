const {Chat , Message} = require('../models/Conversation');
const User = require('../models/User');


const accessChat = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'UserId param not sent with request' });
    }

    try {
        let chat = await Chat.findOne({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } },
            ],
        }).populate('users', '-password').populate('latestMessage');

        if (chat) {
            return res.status(200).json(chat);
        } else {
            const chatData = {
                chatName: 'sender',
                isGroupChat: false,
                users: [req.user._id, userId],
            };

            chat = await Chat.create(chatData);
            const fullChat = await Chat.findOne({ _id: chat._id }).populate('users', '-password');
            res.status(200).json(fullChat);
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};


const createGroupChat = async (req, res) => {
    const { users, name } = req.body;

    if (!users || !name) {
        return res.status(400).json({ error: 'Please provide a name and users for the group chat' });
    }

    try {
        const chat = await Chat.create({
            chatName: name,
            isGroupChat: true,
            users: [...users, req.user._id],
            groupAdmin: req.user._id,
        });

        const fullChat = await Chat.findOne({ _id: chat._id }).populate('users', '-password');
        res.status(200).json(fullChat);
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

const sendMessage = async (req, res) => {
    const { content, chatId , contentType , mediaUrl} = req.body;

    console.log(content , chatId , contentType , mediaUrl);

    if (!chatId || (!content && !mediaUrl)) {
        return res.status(400).json({ error: 'Please provide content and chat ID' });
    }

    try {
        const newMessage = await Message.create({
            sender: req.user._id,
            content : content || null,
            chat: chatId,
            contentType: contentType || 'text',
            mediaUrl: mediaUrl || null,
        });

        const chat = await Chat.findById(chatId).populate('users', 'name email');

        const fullMessage = {
            _id: newMessage._id,
            sender: req.user,
            content: newMessage.content,
            contentType: newMessage.contentType,
            mediaUrl: newMessage.mediaUrl,
            chat: {
                _id: chat._id,
                chatName: chat.chatName,
                isGroupChat: chat.isGroupChat,
                users: chat.users,
                groupAdmin: chat.groupAdmin,
            },
            createdAt: newMessage.createdAt,
        };

        await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage._id });

        res.status(200).json(fullMessage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

const getChats = async (req, res) => {
    console.log('api called ');
    try {
        const chats = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate('users', '-password')
            .populate('groupAdmin', '-password')
            .populate('latestMessage')
            .sort({ updatedAt: -1 });

        const fullChats = await User.populate(chats, {
            path: 'latestMessage.sender',
            select: 'name email profilePic',
        });

        res.status(200).json(fullChats);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;

        // Find the chat by ID to ensure it exists
        const chat = await Chat.findById(chatId).populate('users', 'name email profilePic');
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Find all messages for the chat and populate sender information
        const messages = await Message.find({ chat: chatId })
            .populate('sender', 'name email profilePic')
            .sort({ createdAt: 1 }); // Sort messages by creation date

        res.status(200).json({ chat, messages });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


const getChatDetails = async (req, res) => {
    try {
        const { chatId } = req.params;

        // Find the chat and populate user details
        const chat = await Chat.findById(chatId)
            .populate({
                path: 'users',
                select: 'name email profilePic'
            }).populate('postId' , 'user');
            

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Get all messages with media content and populate sender details
        const messages = await Message.find({ 
            chat: chatId,
            $or: [
                { contentType: { $in: ['image', 'video', 'audio'] } },
                { mediaUrl: { $exists: true, $ne: null } }
            ]
        })
        .populate('sender', 'name email profilePic')
        .sort({ createdAt: -1 });

        // Organize media by type
        const mediaContent = {
            images: [],
            videos: [],
            audio: []
        };

        messages.forEach(message => {
            if (message.contentType === 'image') {
                mediaContent.images.push({
                    url: message.mediaUrl,
                    sender: message.sender,
                    timestamp: message.createdAt
                });
            }
            if (message.contentType === 'video') {
                mediaContent.videos.push({
                    url: message.mediaUrl, 
                    sender: message.sender,
                    timestamp: message.createdAt
                });
            }
            if (message.contentType === 'audio') {
                mediaContent.audio.push({
                    url: message.mediaUrl,
                    sender: message.sender,
                    timestamp: message.createdAt
                });
            }
        });

        res.status(200).json({
            success: true,
            chat: {
                _id: chat._id,
                chatName: chat.chatName,
                isGroupChat: chat.isGroupChat,
                users: chat.users,
                groupAdmin: chat.groupAdmin,
                createdAt: chat.createdAt
            },
            mediaContent
        });

    } catch (error) {
        console.error('Error in getChatDetails: ', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get chat details',
            message: error.message
        });
    }
}






module.exports = { accessChat, createGroupChat ,sendMessage , getMessages , getChats , getChatDetails};