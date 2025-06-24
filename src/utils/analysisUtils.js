const { GoogleGenAI } = require("@google/genai");
const axios = require('axios');
require('dotenv').config();
const crypto = require('crypto');
const AnalysisCache = require('../models/AnalysisCache'); // Import the cache model
const User = require('../models/User');



async function generatePersonalizedAnalysis(traitScores, userId) {
  // --- 1. Generate profileId hash --- 
  // Sort keys to ensure consistent hashing regardless of object order
  const sortedScores = Object.keys(traitScores).sort().reduce((obj, key) => { 
    obj[key] = traitScores[key]; 
    return obj;
  }, {});
  const scoreString = JSON.stringify(sortedScores);
  const profileId = crypto.createHash('sha256').update(scoreString).digest('hex');
  console.log(`Generated profileId: ${profileId}`);

  // --- 2. Check Cache --- 
  try {
    const cachedResult = await AnalysisCache.findOne({ profileId });
    if (cachedResult) {
      console.log(`Cache hit for profileId: ${profileId}`);
      return cachedResult.resultData; // Return cached data directly
    }
    console.log(`Cache miss for profileId: ${profileId}. Generating new analysis...`);
  } catch (cacheError) {
    console.error(`Error checking analysis cache for profileId ${profileId}:`, cacheError);
    // Proceed to generate new analysis even if cache check fails
  }

  // --- 3. Craft Detailed Prompt for Structured JSON --- 
  const prompt = `
Analyze the following big 5 personality trait scores, ranging from -1 to 1:
${JSON.stringify(traitScores, null, 2)}

Generate a detailed personality analysis in JSON format. The JSON object MUST strictly adhere to the following schema:

{
  "profileId": "${profileId}", // Use the provided profileId
  "genZTag": "<string>", // Generate a short, creative, Gen-Z style personality tag (2-3 words, e.g., 'Idea Catalyst', 'Chill Explorer')
  "analysis": {
    "strengths": [
      "<string: strength 1>",
      "<string: strength 2>",
      "<string: strength 3>"
    ],
    "weaknesses": [
      "<string: weakness 1>",
      "<string: weakness 2>",
      "<string: weakness 3>"
    ],
    "communicationStyle": "<string: paragraph describing communication style>",
    "motivationDrivers": "<string: paragraph describing key motivators>",
    "conscientiousnessAgreeableness": "<string: analysis of conscientiousness and agreeableness interaction>",
    "opennessToExperience": "<string: analysis of openness>",
    "resilience": "<string: analysis of resilience>"
  },
  "nuances": {
    "introversionEmotionalStability": "<string: analysis of extraversion and emotional stability interaction>",
    "adaptability": "<string: analysis of adaptability>"
  },
    "contextualExamples": [                   // Real‐world scenarios illustrating key traits
    "<string example 1>",
    "<string example 2>"
  ],
  "overallSummary": "<string: concluding paragraph summarizing the profile>",
  "mentalHealth": {
    "commonStressors": [
      "<string: stressor 1>",
      "<string: stressor 2>",
      "<string: stressor 3>"
    ],
    "selfCareTips": [
      "<string: tip 1>",
      "<string: tip 2>",
      "<string: tip 3>"
    ],
    "redFlags": "<string: paragraph describing potential negative tendencies or 'red flags' to watch out for>"
  }
}

Ensure all string fields are populated appropriately based on the scores. Provide concrete examples where possible. Make the tone insightful, balanced, and constructive.
OUTPUT ONLY THE JSON OBJECT, nothing else before or after.
`;

  //use genAi

 const ai = new GoogleGenAI({ apiKey: process.env.GENAI });


  // Correct structure for the contents parameter
  const genAIResult = await ai.models.generateContent({
    model: "gemini-2.0-flash", // Correct model name if using flash
    contents: [{ parts: [{ text: prompt }] }], // Correct contents structure
    generationConfig: { // Optional: Add generation config
      temperature: 0.7, 
      maxOutputTokens: 1500, // Increase max tokens for detailed JSON
      responseMimeType: "application/json" // Request JSON output directly
    }
  });

  // --- 4. Parse and Validate JSON Response --- 
  let analysisData = null;
  let jsonText = null; // Variable to hold the raw JSON text

  // Access the response text using the correct path from the SDK's result structure
  try {
    // Log the raw response object from GenAI for debugging
    console.log("Raw GenAI API Response Object:", JSON.stringify(genAIResult, null, 2));

    // --- Correctly extract JSON text from candidates --- 
    if (genAIResult && genAIResult.candidates && genAIResult.candidates.length > 0 &&
        genAIResult.candidates[0].content && genAIResult.candidates[0].content.parts && genAIResult.candidates[0].content.parts.length > 0) {
      jsonText = genAIResult.candidates[0].content.parts[0].text;
      console.log("GenAI Response Text (Expecting JSON):", jsonText);
    } else {
       // Handle cases where no valid candidate/text is returned (e.g., safety block)
       console.error("GenAI response structure unexpected or missing text content.", genAIResult);
       throw new Error("GenAI did not return valid response text."); 
    }
    // --- End Text Extraction ---

    // --- Clean the JSON Text --- 
    // Remove potential markdown fences and leading/trailing whitespace
    let cleanedJsonText = jsonText.trim();
    if (cleanedJsonText.startsWith('```json')) {
      cleanedJsonText = cleanedJsonText.substring(7); // Remove ```json
    }
    if (cleanedJsonText.endsWith('```')) {
      cleanedJsonText = cleanedJsonText.substring(0, cleanedJsonText.length - 3);
    }
    cleanedJsonText = cleanedJsonText.trim(); // Trim again just in case
    // --- End Cleaning ---

    // Attempt to parse the JSON text
    analysisData = JSON.parse(cleanedJsonText);

    // Basic validation (can be more thorough)
    if (!analysisData || analysisData.profileId !== profileId ) {
      throw new Error("Generated JSON is invalid or missing key fields.");
    } 

    // --- 5. Save to Cache --- 
    try {
      const newCacheEntry = new AnalysisCache({ profileId, resultData: analysisData });
      await newCacheEntry.save();
      //save to user
      await User.findByIdAndUpdate(userId, { $set: { resultData: analysisData } });
     
      console.log(`Saved new analysis to cache for profileId: ${profileId}`);
    } catch (cacheSaveError) {
      // Log error but don't block returning the result
      console.error(`Error saving analysis to cache for profileId ${profileId}:`, cacheSaveError);
    }

  } catch (parseError) {
    console.error("Error processing or parsing GenAI response:", parseError);
    console.error("GenAI Raw Response Text was:", jsonText || '[Could not retrieve text]'); // Log the text that failed parsing
    // You might want to return a default error structure or throw the error
    // For now, return null or a specific error object
    return { error: "Failed to generate or parse analysis.", details: parseError.message }; 
  }

  return analysisData; // Return the structured JSON data
}

module.exports = {generatePersonalizedAnalysis}