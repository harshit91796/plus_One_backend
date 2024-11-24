const express = require('express');
const { searchUsers , getUser , getUserPosts} = require('../controllers/usersActivity');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/searchUsers' ,protect, searchUsers);
router.get('/getUserProfile/:userId', getUser);
router.get('/getUserPosts/:userId', getUserPosts);

module.exports = router;