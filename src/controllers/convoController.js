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
    const { content, chatId } = req.body;

    if (!content || !chatId) {
        return res.status(400).json({ error: 'Please provide content and chat ID' });
    }

    try {
        const newMessage = await Message.create({
            sender: req.user._id,
            content,
            chat: chatId,
        });

        const chat = await Chat.findById(chatId).populate('users', 'name email');

        const fullMessage = {
            _id: newMessage._id,
            sender: req.user,
            content: newMessage.content,
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
            select: 'name email',
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
        const messages = await Message.find({ chat: chatId }).populate('sender', 'name email').populate('chat');
        res.status(200).json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};






module.exports = { accessChat, createGroupChat ,sendMessage , getMessages , getChats};