const User = require('../models/User');
const Post = require('../models/Post');

const searchUsers = async (req, res) => {
  
    try {
        const searchQuery = req.query.search;
        if (!searchQuery) {
          return res.status(400).send({ message: 'Search query is required' });
        }
    
        const users = await User.find({
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } },
          ],
          _id: { $ne: (req.user && req.user._id) || null }
        });
    
        res.send(users);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
}


const getUser = async (req, res) => {
  const userId = req.params.userId;
  const user = await User.findById(userId);
  res.send(user);
}


const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId;
    const posts = await Post.find({ user: userId })
      .populate('user', 'name profilePic')
      .populate({
        path: 'groupChat',
        select: 'name gender profilePic', // Include any other user fields you need
        model: 'User'
      });

    // Add participant counts to each post
    const postsWithCounts = posts.map(post => {
      const joinedUsers = post.groupChat || [];
      const totalJoined = joinedUsers.length;
      const maleJoined = joinedUsers.filter(user => user.gender === 'male').length;
      const femaleJoined = joinedUsers.filter(user => user.gender === 'female').length;

      return {
        ...post.toObject(), // Convert mongoose document to plain object
        joinedCounts: {
          total: totalJoined,
          male: maleJoined,
          female: femaleJoined,
          remainingSpots: post.peopleNeeded - totalJoined,
          remainingMale: post.maleNeeded ? post.maleNeeded - maleJoined : null,
          remainingFemale: post.femaleNeeded ? post.femaleNeeded - femaleJoined : null
        }
      };
    });

    res.send(postsWithCounts);
  } catch (error) {
    console.error('Error in getUserPosts:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
};

module.exports = { searchUsers , getUser , getUserPosts};