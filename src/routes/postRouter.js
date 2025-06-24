const express = require('express');
const router = express.Router();
const { createPost , requestToJoinPost, handleRequest, getAllPosts, searchPosts , getHashtagSuggestions} = require('../controllers/postController');
const { protect } = require('../middlewares/authMiddleware');


router.post('/create-post', protect, createPost);
router.put('/:id/requests/:requestId', handleRequest);

router.post('/:id/request', protect,requestToJoinPost);
router.get('/feed',getAllPosts);


router.get('/search', searchPosts);
router.get('/hashtags/suggest', getHashtagSuggestions);


module.exports = router;


