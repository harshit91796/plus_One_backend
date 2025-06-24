const express = require('express')
const router = express.Router()
const {getNextQuestion, questionOptionIdFix } = require('../controllers/questionController')
const { saveResponse } = require('../controllers/responseController')
const { getResults } = require('../controllers/result')
// const { getAllUsers } = require('../controllers/userController')

router.get('/questions/next', getNextQuestion);
router.post('/response', saveResponse)
router.get('/results', getResults)
// router.get('/getAllUsers', getAllUsers)
// router.get('/question/fix', questionOptionIdFix) // Comment out again after successful fix

module.exports = router
