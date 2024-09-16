const express = require('express');
const { searchUsers } = require('../controllers/usersActivity');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/searchUsers' ,protect, searchUsers);

module.exports = router;