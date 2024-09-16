const express = require('express');

const router = express.Router();

const { accessChat, createGroupChat, sendMessage, getMessages, getChats } = require('../controllers/convoController');
const { protect } = require('../middlewares/authMiddleware');
const messageRequestController = require('../controllers/messageRequestController');

router.post('/accessChat', protect, accessChat);
router.post('/group', protect, createGroupChat);
router.post('/message', protect, sendMessage);
router.get('/getMessages/:chatId', getMessages);
router.get('/getChats', protect, getChats);

router.post('/send-message-request', protect, messageRequestController.sendMessageRequest);
router.post('/handle-message-request', protect, messageRequestController.handleMessageRequest);
router.get('/message-requests', protect, messageRequestController.getMessageRequests);

module.exports = router;
