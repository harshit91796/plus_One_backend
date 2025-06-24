// controllers/responseController.js
const Response = require('../models/Response');
const Question = require('../models/Question');
const User = require('../models/User');

/**
 * Helper function to update the user's personality trait estimates.
 * It gathers all responses for the user, looks up question details,
 * aggregates weighted trait values, calculates averages, and then updates the User record.
 */
async function updateUserTraits(userId) {
  try {
    // Retrieve all responses given by the user.
    const responses = await Response.find({ user: userId });
    if (responses.length === 0) return;

    // Initialize sums and counts for each trait.
    const traitSums = {
      extraversion: 0,
      openness: 0,
      conscientiousness: 0,
      agreeableness: 0,
      emotionalStability: 0,
      adaptability : 0,
      resilience: 0
    };
    let counts = {
      extraversion: 0,
      openness: 0,
      conscientiousness: 0,
      agreeableness: 0,
      emotionalStability: 0,
      adaptability: 0,
      resilience: 0

    };

    // Get details of questions corresponding to these responses.
    const questionIds = responses.map(r => r.question);
    const questions = await Question.find({ _id: { $in: questionIds } });

    responses.forEach(response => {
      // Find the question document for this response.
      const question = questions.find(q => q._id.toString() === response.question.toString());
      console.log("questionmmmmmm",question.options[0]._id)
      if (!question) {
        // console.log(`[updateUserTraits] Question not found for response with questionId: ${response.question}`);
        return;
      }
      
      // Identify the option selected by the user.
      // console.log(`[updateUserTraits] Trying to find optionId: ${response.selectedOption} in question ${question._id}`);
      // --- Debug Log: Show the actual options being searched --- 
      // console.log("[updateUserTraits] Options array being searched:", JSON.stringify(question.options, null, 2));
      // --- End Debug Log ---
      const selectedOption = question.options.find(opt => opt._id.toString() === response.selectedOption.toString());
      console.log("selectedoption",selectedOption)

      if (!selectedOption) {
        // console.log(`[updateUserTraits] Selected option ${response.selectedOption} NOT FOUND in question ${question._id}`);
        return;
      }

      // Check if traits exist on the option
      if (!selectedOption.traits || selectedOption.traits.length === 0) {
        // console.log(`[updateUserTraits] No traits found on selected option ${selectedOption._id} in question ${question._id}`);
        return;
      }
     
      // For each trait impacted by the chosen option, accumulate the weighted value.
      selectedOption.traits.forEach(trait => {
        // --- Debug Log: Check values being added --- 
        // console.log(`[updateUserTraits] Processing trait: Dimension=${trait.dimension}, Value=${trait.value}, Weight=${trait.weight}`);
        // --- End Debug Log ---
        if (traitSums.hasOwnProperty(trait.dimension)) {
          traitSums[trait.dimension] += trait.value * trait.weight;
          counts[trait.dimension]++;
        }
      });
    });

    // Calculate the average value for each trait.
    const averages = {};
    Object.keys(traitSums).forEach(trait => {
      averages[trait] = counts[trait] ? traitSums[trait] / counts[trait] : 0;
    });

    console.log('update personality traits', averages)

    // Update the User's personalityTraits field with the calculated averages.
    await User.findByIdAndUpdate(userId, { personalityTraits: averages });
  } catch (error) {
    console.error('Error updating user traits:', error);
  }
}

/**
 * Controller function to save a user's response.
 * It handles both creating a new response and updating an existing one.
 */
const saveResponse = async (req, res) => {
  console.log('save response calleddddd' , req.body)
  try {
    // Extract questionId, optionId, and responseTime from the request body.
    const { questionId, optionId, responseTime , userId } = req.body;
   

    // Check if the user has already responded to this question.
    let responseDoc = await Response.findOne({ user: userId, question: questionId });
    if (responseDoc) {
      // Update the existing response.
      responseDoc.selectedOption = optionId;
      responseDoc.responseTime = responseTime;
      await responseDoc.save();
    } else {
      // Otherwise, create a new response record.
      responseDoc = new Response({
        user: userId,
        question: questionId,
        selectedOption: optionId,
        responseTime
      });
      await responseDoc.save();
    }

    // Update the user's overall trait estimates after saving the response.
    await updateUserTraits(userId );

    // Send back a response confirming the action.
    res.json({ message: 'Response saved successfully.', response: responseDoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {saveResponse}
