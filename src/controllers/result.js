const { generatePersonalizedAnalysis } = require('../utils/analysisUtils'); // Assume you placed the above function here
const User = require('../models/User');
const Response = require('../models/Response'); // Also ensure Response model is imported if used

const getResults = async (req, res) => {
  try {
    // Read userId from query parameters
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID missing from query parameters.' });
    }

    const user = await User.findById(userId);
    console.log("user get results",user)
    // Check if user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if assessment is complete (e.g., 25 questions answered)
    const responses = await Response.find({ user: userId });
    if (responses.length < 25) {
      return res.status(400).json({ error: 'Assessment not complete yet.' });
    }
    
    // Use updated personalityTraits
    const traitScores = user.personalityTraits;

    // Generate (or retrieve from cache) the structured analysis
    const analysisResult = await generatePersonalizedAnalysis(traitScores ,userId);

    // Check if analysis generation failed
    if (analysisResult.error) {
      console.error("Analysis generation failed:", analysisResult.details);
      // Return an appropriate error response to the frontend
      return res.status(500).json({ error: 'Failed to generate personality analysis.' });
    }

    // Update user's completion status if not already done (e.g., by question controller)
    if (!user.assessmentCompleted) {
       console.log(`Updating assesmentCompleted for user ${userId} in getResults`);
       user.assessmentCompleted = true;
       await user.save(); // Save only the completion status update
    }

    res.json({
      personalityTraits: traitScores, // Send the raw scores
      assessmentAnalysis: analysisResult // Send the structured analysis object
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {getResults}
