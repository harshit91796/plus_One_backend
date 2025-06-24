// controllers/questionController.js
const Question = require('../models/Question');
const Response = require('../models/Response');
const User = require('../models/User');

// List of traits we care about.
const traitDimensions = ['extraversion', 'openness', 'conscientiousness', 'agreeableness', 'emotionalStability', 'resilience', 'adaptability'];

// A threshold: Minimum number of questions answered per trait for a "stable" estimate.
const MIN_QUESTIONS_PER_TRAIT = 3;

// Helper function: Count how many responses have affected each trait.
async function countTraitResponses(userId) {
  // Get all responses by the user.
  const responses = await Response.find({ user: userId });
  // Initialize counts.
  const counts = {};
  traitDimensions.forEach(dim => counts[dim] = 0);

 

  // Get all questions for these responses.
  const questionIds = responses.map(r => r.question);
  const questions = await Question.find({ _id: { $in: questionIds } });

  responses.forEach(response => {
    // Find the question the response belongs to.
    const question = questions.find(q => q._id.toString() === response.question.toString());
    if (!question) return;
    // Find the option chosen.
    const selectedOption = question.options.find(opt => opt._id.toString() === response.selectedOption.toString());
    if (!selectedOption) return;
    // For every trait affected in the chosen option, add 1 to its count.
    selectedOption.traits.forEach(trait => {
      if (counts.hasOwnProperty(trait.dimension)) {
        counts[trait.dimension]++;
      }
    });
  });
  
  return counts;
}

const getNextQuestion = async (req, res) => {
  
  try {
    // Read userId from query parameters (e.g., /api/questions/next?userId=123)
    const userId = req.query.userId;

    // Add a check if userId is missing from the query
    if (!userId) {
      console.error('User ID missing from query parameters');
      return res.status(400).json({ error: 'User ID is required in query parameters.' });
    }

    console.log(`Fetching next question for userId: ${userId}`);

    // Get responses the user has already answered.
    const answeredResponses = await Response.find({ user: userId }).select('question');
    const answeredIds = answeredResponses.map(r => r.question);

    // Check if a fixed total count has been reached (for example, 25 questions)
    if (answeredResponses.length >= 25) {
      await User.findByIdAndUpdate(userId, { $set: { assessmentCompleted: true } });
      return res.json({ completed: true, message: 'Assessment completed.' });
    }

    // STEP 1: Determine current per-trait counts from existing responses.
    const traitCounts = await countTraitResponses(userId);
    console.log('Trait counts:', traitCounts);

    // STEP 2: Look for any trait that hasn't yet reached the minimum threshold.
    let underMeasuredTrait = null;
    for (const trait of traitDimensions) {
      if (traitCounts[trait] < MIN_QUESTIONS_PER_TRAIT) {
        underMeasuredTrait = trait;
        break; // In this simple model, we focus on one at a time.
      }
    }

    let nextQuestion;
    if (underMeasuredTrait) {
      // If one trait is underrepresented, try to find an unanswered question
      // that targets this trait (i.e. one whose options affect that trait).
      nextQuestion = await Question.findOne({
        _id: { $nin: answeredIds },
        active: true,
        "options.traits.dimension": underMeasuredTrait
      }).sort({ 'metadata.discrimination': -1 }); // Prefer questions with higher discrimination.
      console.log(`Selecting question targeting under-measured trait: ${underMeasuredTrait}`);
    }
    if (!nextQuestion) {
      // If no underrepresented trait found or no specific question available, select a question
      // from the unanswered pool sorted by discrimination.
      nextQuestion = await Question.findOne({
        _id: { $nin: answeredIds },
        active: true
      }).sort({ 'metadata.discrimination': -1 });
      console.log('Selecting fallback question by overall discrimination.');
    }
    if (!nextQuestion) {
      return res.json({ completed: true, message: 'No more questions available.' });
    }
    // Prepare a clean object for the frontend, sending only necessary fields.
    const questionForDisplay = {
      id: nextQuestion._id,
      text: nextQuestion.text,
      type: nextQuestion.type,
      options: nextQuestion.options.map(opt => ({
        id: opt._id,
        text: opt.text
      }))
    };
    res.json(questionForDisplay);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const questionOptionIdFix = async (req, res) => {
  // get all questions
  const questions = await Question.find({});
 
  // for each question, for each option, check if the option id is in the question options array
  // if not, add it
  // save the question
  for (const question of questions) {
    let modified = false; // Flag to track if changes were made
    
    for (const option of question.options) {
      if(!option._id){
        option._id = new mongoose.Types.ObjectId();
        modified = true; // Mark that we added an ID
      }
    }
    
    // If we added any IDs to this question's options, mark the array as modified
    if (modified) {
      question.markModified('options');
    }
  }

  // Save each modified question document individually
  await Promise.all(questions.map(question => question.save()));

  console.log(`${questions.length} questions processed and saved.`);
  res.json({ message: `${questions.length} questions processed and saved.` });
}

module.exports = {getNextQuestion, questionOptionIdFix}
