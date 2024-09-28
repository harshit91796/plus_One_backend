const { Chat } = require('../models/Conversation');
const Post = require('../models/Post');
const User = require('../models/User');
const ObjectId = require('mongoose').Types.ObjectId;
// const { Types } = require('mongoose');
// const mongoose = require('mongoose');

const testObjectIdConversion = (testId) => {
    try {
        // const testId = '66cb352abcb599fdd5ab383a';
        const testObjectId = new mongoose.Types.objectId(testId);
        console.log('Test ObjectId:', testObjectId);
        console.log('Test ObjectId to string:', testObjectId.toString());
    } catch (error) {
        console.error('Test ObjectId conversion error:', error);
    }

};

const createPost = async (req, res) => {
    console.log('hiii');
    const { title, description, location, coordinates, date,image, peopleNeeded } = req.body;

   // Validate required fields
   if (!title || !description || !location || !coordinates || !date || !peopleNeeded) {
    return res.status(400).json({ error: 'All fields are required' });
}

try {
    const post = new Post({
        user: req.user._id,
        title,
        description,
        location: {
            type: 'Point',
            coordinates: coordinates,
            formatted: location
        },
        date,
        image ,
        peopleNeeded,
    });


        await post.save();

        res.status(201).json({ success: true, post });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create post', details: err.message });
    }
};

const requestToJoinPost = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user._id;

    try {
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if the user has already requested to join
        const existingRequest = post.requests.find(
            (request) => request.user.toString() === userId.toString()
        );

        if (existingRequest) {
            return res.status(400).json({ error: 'You have already requested to join this post' });
        }

        // Add the request to the post
        post.requests.push({ user: userId });

        await post.save();

        res.status(200).json({ success: true, message: 'Request sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send request', details: err.message });
    }
};

const handleRequest = async (req, res) => {
    console.log('handleRequest');
    // testObjectIdConversion(req.params.requestId);
    const postId = req.params.id;
    const requestId = req.params.requestId;
    const action = req.body.action; // "accept" or "reject"
     console.log("userrequestid",requestId);
    try {
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        console.log("postrequest",post.requests);
        
        const requestMatched = post.requests.find(req => req.user.equals(new ObjectId(requestId)));

        console.log('Matching request:', requestMatched);

        if (!requestMatched) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (requestMatched.status !== 'pending') {
            return res.status(400).json({ error: 'Request already handled' });
        }

        if (action === 'accept') {
            requestMatched.status = 'accepted';

            // Automatically add the user to the group chat
            if (!post.groupChat.includes(requestMatched.user)) {
                post.groupChat.push(requestMatched.user);
            }

            // Find or create the group chat
            let groupChat = await Chat.findOne({ postId, isGroupChat: true });

            if (!groupChat) {
               console.log('post' , post.user ,'request' , requestMatched.user);

                groupChat =  new Chat({
                    postId : postId,
                    chatName: post.title,
                    isGroupChat: true,
                    users: [post.user], // Include the post creator
                });

                groupChat.users.push(requestMatched.user);
                await groupChat.save();

            }else {
                 // Add the new member to the group chat
            groupChat.users.push(requestMatched.user);
            await groupChat.save();

            }

           
        } else if (action === 'reject') {
            requestMatched.status = 'rejected';
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

        await post.save();

        res.status(200).json({ success: true, message: `Request ${action}ed successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};


const getPost = async (req, res) => {
    const postId = req.params.id;
    try {
        const post = await Post.findById(postId).populate('user');
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.status(200).json({ success: true, post });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get post', details: err.message });
    }
};

const getAllPosts = async (req, res) => {
    console.log('getAllPosts');
    try {
        let query = {};
        const { location, range, gender } = req.query;

        // Filter by location and range if provided
        if (location && range) {
            // Assuming location is provided as "latitude,longitude"
            const [lat, lng] = location.split(',').map(Number);
            const radiusInKm = Number(range);

            query.location = {
                $geoWithin: {
                    $centerSphere: [[lng, lat], radiusInKm / 6371] // 6371 is Earth's radius in km
                }
            };
        }

        // Filter by gender if provided
        if (gender) {
            query.gender = gender;
        }

        console.log('query',query);

        const posts = await Post.find(query)
            .populate('user')
            .populate('user', 'name profilePic') // Populate user details
            .sort({ createdAt: -1 }); // Sort by most recent first
            console.log('posts',posts);
            // const filter = posts.filter((post) => post.user.name == 'sofiya');

        res.status(200).json({ success: true, posts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get posts', details: err.message });
    }

};



const getRequests = async (req, res) => {
    const postId = req.params.id;
    try {
        const post = await Post.findById(postId).populate('requests.user');
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.status(200).json({ success: true, requests: post.requests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get requests', details: err.message });
    }
};


module.exports = { createPost ,requestToJoinPost ,handleRequest ,getAllPosts };