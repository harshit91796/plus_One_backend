const User = require('../models/User');

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

module.exports = { searchUsers };