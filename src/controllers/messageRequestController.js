const { Chat, Message, MessageRequest } = require('../models/Conversation');
const Post = require('../models/Post');
const User = require('../models/User');

exports.sendMessageRequest = async (req, res) => {
    try {
        const { receiverId, postId, message } = req.body;
        const senderId = req.user._id;
         console.log(receiverId, postId, message);
        // Check if the receiver is already in the sender's following list
        const sender = await User.findById(senderId);
        if (sender.following.includes(receiverId) && sender.followers.includes(receiverId) && !sender.blocked.includes(receiverId) && !receiver.blocked.includes(senderId)) {
            // If yes, create a regular chat
            const chat = await Chat.create({
                users: [senderId, receiverId],
                isTemporary: false,
            });
            
            if(message){
                const newMessage = await Message.create({
                    sender: senderId,
                    content: message ,
                    chat: chat._id,
                });
    
                chat.messages.push(newMessage);
            }
            
            await chat.save();

            return res.status(200).json({ chat, message: newMessage });
        }

        // If not, create a temporary chat and message request
        const tempChat = await Chat.create({
            users: [senderId, receiverId],
            isTemporary: true,
            postId: postId || null,

        });

        if(message !== undefined){
            const newMessage = await Message.create({
                sender: senderId,
                content: message,
                chat: tempChat._id,
            });
            tempChat.messages.push(newMessage);
            tempChat.latestMessage = newMessage._id;
            
        }

        
        

        const messageRequest = await MessageRequest.create({
            sender: senderId,
            receiver: receiverId,
            postId: postId || null,
            chat: tempChat._id,
        });

        tempChat.messageRequests = messageRequest._id;
        await tempChat.save();

        if(postId){
            await User.findByIdAndUpdate(senderId, { $push: { messageRequestsSent: postId } });
            await Post.findByIdAndUpdate(postId, { $push: { requests: { user: senderId, status: 'pending' } } });
        }

        console.log('tempChat', tempChat);

        res.status(200).json({ chat: tempChat });
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

            let chat = await Chat.findById(messageRequest.chat);
            let post = await Post.findById(messageRequest.postId);
            chat.isTemporary = false;
            if (messageRequest.postId === null) {
                 chat.isTemporary = false;
                 await chat.save();
                 return res.status(200).json({ message: 'Message request accepted', chat });
            }
            

            // If it's a post-related request, add the sender to the post's group chat
            if (messageRequest.postId) {
                // Implement logic to add user to the post's group chat
                if(!post.groupChatId ){
                     let groupChat = await Chat.create({
                        chatName: post.title,
                        users: [messageRequest.sender, messageRequest.receiver],
                        isTemporary: false,
                        postId: post._id,
                        isGroupChat: true,
                       })
                       post.groupChat.push(messageRequest.sender,messageRequest.receiver);
                       post.groupChatId = groupChat._id;
                       await post.save();

                       return res.status(200).json({ message: 'Message request accepted', chat: groupChat });
                }
                else{
                    let groupChat = await Chat.findById(post.groupChatId);
                    groupChat.users.push(messageRequest.sender);
                    await groupChat.save();
                    post.groupChat.push(messageRequest.sender);
                    await post.save();
                    return res.status(200).json({ message: 'Message request accepted', chat: groupChat });
                }
            }

            
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

exports.getMessageRequest = async (req, res) => {
    try {
        const requestId = req.body.requestId;
        const messageRequest = await MessageRequest.findById(requestId);
        res.status(200).json( { success: true, messageRequest, message: 'Message request fetched successfully'});
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
