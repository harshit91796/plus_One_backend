const { Chat, Message, MessageRequest } = require('../models/Conversation');
const Post = require('../models/Post');
const User = require('../models/User');

exports.sendMessageRequest = async (req, res) => {
    try {
        const { receiverId, postId, message } = req.body;
        const senderId = req.user._id;

        // Check if the receiver is already in the sender's following list
        const sender = await User.findById(senderId);
        if (sender.following.includes(receiverId) && sender.followers.includes(receiverId) && !sender.blocked.includes(receiverId) && !receiver.blocked.includes(senderId)) {
            // If yes, create a regular chat
            const chat = await Chat.create({
                users: [senderId, receiverId],
                isTemporary: false,
            });

            const newMessage = await Message.create({
                sender: senderId,
                content: message,
                chat: chat._id,
            });

            chat.messages.push(newMessage);
            await chat.save();

            return res.status(200).json({ chat, message: newMessage });
        }

        // If not, create a temporary chat and message request
        const tempChat = await Chat.create({
            users: [senderId, receiverId],
            isTemporary: true,
            postId: postId || null,
        });

        const newMessage = await Message.create({
            sender: senderId,
            content: message,
            chat: tempChat._id,
        });

        tempChat.messages.push(newMessage);
        await tempChat.save();

        const messageRequest = await MessageRequest.create({
            sender: senderId,
            receiver: receiverId,
            postId: postId || null,
            chat: tempChat._id,
        });

        res.status(200).json({ messageRequest, tempChat, message: newMessage });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.handleMessageRequest = async (req, res) => {
    try {
        const { requestId, action } = req.body;
        const userId = req.user._id;

        const messageRequest = await MessageRequest.findById(requestId);
        if (!messageRequest) {
            return res.status(404).json({ error: 'Message request not found' });
        }

        if (messageRequest.receiver.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (action === 'accept') {
            messageRequest.status = 'accepted';
            await messageRequest.save();

            const chat = await Chat.findById(messageRequest.chat);
            chat.isTemporary = false;
            if (messageRequest.postId) {
                chat.isGroupChat = true;
                chat.groupAdmin = userId;
            }
            await chat.save();

            // If it's a post-related request, add the sender to the post's group chat
            if (messageRequest.postId) {
                // Implement logic to add user to the post's group chat
                const post = await Post.findById(messageRequest.postId);
                post.groupChat.push(userId);
                await post.save();
            }

            res.status(200).json({ message: 'Message request accepted', chat });
        } else if (action === 'reject') {
            messageRequest.status = 'rejected';
            await messageRequest.save();

            // Delete the temporary chat
            await Chat.findByIdAndDelete(messageRequest.chat);

            res.status(200).json({ message: 'Message request rejected' });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getMessageRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        const messageRequests = await MessageRequest.find({ receiver: userId, status: 'pending' })
            .populate('sender', 'name email')
            .populate('postId', 'title');

        res.status(200).json(messageRequests);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
