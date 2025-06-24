const express = require('express');
const { searchUsers , getUser , getUserPosts} = require('../controllers/usersActivity');
const { protect } = require('../middlewares/authMiddleware');
const { introStory, StoryPosts , profileDetails , uploadGalleryPhoto, getUserGallery, deleteGalleryPhoto, updateStoryPost, deleteStoryPost } = require('../controllers/profileDetailsController');
const router = express.Router();

//profile details

router.post('/profile/intro-story', protect,introStory);
router.post('/profile/story-posts', protect, StoryPosts);
router.put('/profile/updateStory-posts/:id', protect, updateStoryPost);
router.delete('/profile/deleteStory-posts/:id', protect, deleteStoryPost);
router.get('/profile-details/:id', profileDetails);

// New Photo Gallery routes
router.post('/profile/uploadGalleryPhoto', protect, uploadGalleryPhoto);
router.get('/profile/getUserGallery/:userId', getUserGallery);
router.delete('/profile/deleteGalleryPhoto/:photoId', protect, deleteGalleryPhoto);



router.get('/searchUsers' ,protect, searchUsers);
router.get('/getUserProfile/:userId', getUser);
router.get('/getUserPosts/:userId', getUserPosts);

module.exports = router;