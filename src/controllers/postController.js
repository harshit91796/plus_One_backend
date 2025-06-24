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

const extractHashtags = (text) => {
    const regex = /#(\w+)/g;
    const tags = [];
    let match;
    while ((match = regex.exec(text))) {
        tags.push(match[1].toLowerCase()); // store lowercase for case-insensitive search
    }
    return tags;
};

const createPost = async (req, res) => {
    const { title, description, location, date, peopleNeeded } = req.body;

    // Validate required fields
    if (!title || !description || !location || !date || !peopleNeeded) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Ensure coordinates are numbers
        // const [longitude, latitude] = coordinates.map(coord => Number(coord));

        const hashtags = [
            ...extractHashtags(title),
            ...extractHashtags(description),
        ];
        
        const post = new Post({
            user: req.user._id,
            ...req.body,
            hashtags

        });

        await post.save();
        res.status(201).json({ success: true, post });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create post', details: err.message });
    }
};

// GET /hashtags/suggest?query=foo
const getHashtagSuggestions = async (req, res) => {
    try {
      const query = req.query.query || '';
      if (!query) return res.status(400).json({ error: 'Query required' });
  
      const suggestions = await Post.aggregate([
        { $unwind: '$hashtags' },
        {
          $match: {
            hashtags: { $regex: '^' + query, $options: 'i' } // case-insensitive startsWith
          }
        },
        {
          $group: {
            _id: '$hashtags',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
  
      res.status(200).json(suggestions.map(tag => tag._id));
    } catch (error) {
      res.status(500).json({ message: error.message });
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

//Bhopal Airport, CTD road, Bairagarh, Bhopal - 462001, Madhya Pradesh, India ,77.3294218, 23.2906459
const searchPosts = async (req, res) => {
    try {
        const { 
            query,
            selectedHashtag,
            currentLatitude,
            currentLongitude,
            range , // 10km default range
            // limit = limit ? limit : 4,
            // skip = skip ? skip : 0
        } = req.query;

         // IMPORTANT: Initialize limit and skip with default values first
    let limit = 10; // Default limit
    let skip = 0;   // Default skip
    
    
    // Then update them if provided in the query
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
    }
    
    if (req.query.skip) {
      skip = parseInt(req.query.skip);
    }

        // Log input parameters
        console.log('Search Parameters:', {
            query,
            selectedHashtag,
            currentLatitude,
            currentLongitude,
            range,
            limit,
            skip
        });

        // Validate coordinates if provided
        let validCoordinates = false;
        if (currentLatitude && currentLongitude) {
            const lat = parseFloat(currentLatitude);
            const lng = parseFloat(currentLongitude);
            validCoordinates = !isNaN(lat) && !isNaN(lng) && 
                             lat >= -90 && lat <= 90 && 
                             lng >= -180 && lng <= 180;

            console.log('Coordinates validation:', {
                validCoordinates,
                parsedLat: lat,
                parsedLng: lng
            });
        }

        const aggregationPipeline = [];

        // Add geoNear stage if coordinates are valid
        if (validCoordinates) {
            const geoNearStage = {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [
                            parseFloat(currentLongitude),
                            parseFloat(currentLatitude)
                        ]
                    },
                    distanceField: 'distance',
                    maxDistance: parseInt(range ? range : 10000),
                    spherical: true,
                    distanceMultiplier: 0.001 // Convert distance to kilometers
                }
            };
            
            console.log('GeoNear stage:', JSON.stringify(geoNearStage, null, 2));
            aggregationPipeline.push(geoNearStage);
        }

        // Add title search if query is provided
        if (query || selectedHashtag) {
            const matchQuery = {
              $and: []
            };
          
            // If a hashtag is selected, always filter by that hashtag
            if (selectedHashtag) {
              matchQuery.$and.push({
                hashtags: selectedHashtag.toLowerCase().replace(/^#/, '')
              });
            }
          
            // If there's a query, add the OR search conditions
            if (query) {
              matchQuery.$and.push({
                $or: [
                  { title: { $regex: query, $options: 'i' } },
                  { checkpoints: { $regex: query, $options: 'i' } },
                  { 'location.formatted': { $regex: query, $options: 'i' } },
                  { hashtags: { $in: [query.toLowerCase().replace(/^#/, '')] } }
                ]
              });
            }
          
            aggregationPipeline.push({
              $match: matchQuery
            });
          }
          

        // Add sorting if no geospatial query (geospatial queries handle their own sorting)
        if (!validCoordinates) {
            aggregationPipeline.push({
                $sort: { createdAt: -1 }
            });
        }

        // Add pagination
        aggregationPipeline.push(
            { $skip: parseInt(skip) },
            { $limit: parseInt(limit) }
        );

        // Add user lookup
        aggregationPipeline.push({
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user'
            }
        });

        // Unwind user array
        aggregationPipeline.push({
            $unwind: '$user'
        });

        // Add this lookup stage before the project stage
        aggregationPipeline.push({
            $lookup: {
                from: 'users',
                localField: 'groupChat',
                foreignField: '_id',
                as: 'groupChatUsers'
            }
        });

        // Then modify the project stage
        aggregationPipeline.push({
            $project: {
                title: 1,
                description: 1,
                location: 1,
                date: 1,
                image: 1,
                peopleNeeded: 1,
                maleNeeded: 1,
                femaleNeeded: 1,
                budget: 1,
                checkpoints: 1,
                startTime: 1,
                endTime: 1,
                public: 1,
                groupChat: 1,
                requests: 1,
                createdAt: 1,
                distance: 1,
                'user._id': 1,
                'user.name': 1,
                'user.profilePic': 1,
                joinedCounts: {
                    total: { $size: "$groupChat" },
                    male: {
                        $size: {
                            $filter: {
                                input: "$groupChatUsers",  // Use the looked-up users
                                as: "user",
                                cond: { $eq: ["$$user.gender", "male"] }
                            }
                        }
                    },
                    female: {
                        $size: {
                            $filter: {
                                input: "$groupChatUsers",  // Use the looked-up users
                                as: "user",
                                cond: { $eq: ["$$user.gender", "female"] }
                            }
                        }
                    },
                    remainingSpots: { 
                        $subtract: [
                            { $toInt: { $ifNull: ["$peopleNeeded", 0] } }, 
                            { $size: "$groupChat" } 
                        ] 
                    },
                    remainingMale: {
                        $cond: {
                            if: { $ne: ["$maleNeeded", null] },
                            then: {
                                $subtract: [
                                    { $toInt: { $ifNull: ["$maleNeeded", 0] } },
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$groupChatUsers",  // Use the looked-up users
                                                as: "user",
                                                cond: { $eq: ["$$user.gender", "male"] }
                                            }
                                        }
                                    }
                                ]
                            },
                            else: null
                        }
                    },
                    remainingFemale: {
                        $cond: {
                            if: { $ne: ["$femaleNeeded", null] },
                            then: {
                                $subtract: [
                                    { $toInt: { $ifNull: ["$femaleNeeded", 0] } },
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$groupChatUsers",  // Use the looked-up users
                                                as: "user",
                                                cond: { $eq: ["$$user.gender", "female"] }
                                            }
                                        }
                                    }
                                ]
                            },
                            else: null
                        }
                    }
                }
            }
        });

        // Log final pipeline
        console.log('Final Aggregation Pipeline:', JSON.stringify(aggregationPipeline, null, 2));

        // Verify index exists
        const indexes = await Post.collection.getIndexes();
        console.log('Collection indexes:', indexes);

        // Execute aggregation
        const posts = await Post.aggregate(aggregationPipeline);
        console.log(`Found ${posts.length} posts`);

        // Sample first post for debugging
        if (posts.length > 0) {
            console.log('Sample post:', JSON.stringify(posts[0], null, 2));
        }

        // Get total count
        const countPipeline = [...aggregationPipeline];
        countPipeline.splice(-4); // Remove last 4 stages
        countPipeline.push({ $count: 'total' });
        const totalDocs = await Post.aggregate(countPipeline);
        const total = totalDocs.length > 0 ? totalDocs[0].total : 0;

        res.status(200).json({
            success: true,
            data: {
                posts,
                total,
                hasMore: total > (parseInt(skip) + posts.length),
                searchParams: {
                    coordinates: validCoordinates ? {
                        lat: parseFloat(currentLatitude),
                        lng: parseFloat(currentLongitude)
                    } : null,
                    range: parseInt(range),
                    query
                }
            }
        });

    } catch (error) {
        console.error('Search error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Error searching posts',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

module.exports = { createPost ,requestToJoinPost ,handleRequest ,getAllPosts ,searchPosts ,getHashtagSuggestions };
