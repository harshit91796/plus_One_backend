 /**
 * Calculates personality trait scores based on user responses
 * @param {Array} responses - User response data with question and option IDs
 * @param {Array} questions - Question data with trait mappings
 * @returns {Object} Calculated trait scores
 */
 const calculateTraitScores = async (responses, questions) => {
    // Initialize trait dimensions with zero values
    const traits = {
      extraversion: 0,
      agreeableness: 0,
      conscientiousness: 0,
      emotionalStability: 0,
      openness: 0,
      adaptability: 0,
      resilience: 0
    };
    
    // Track response counts per dimension for normalization
    const dimensionCounts = Object.keys(traits).reduce((acc, dim) => {
      acc[dim] = 0;
      return acc;
    }, {});
    
    // Process each response
    responses.forEach(response => {
      const question = questions.find(q => q._id.toString() === response.question.toString());
      if (!question) return;
      
      const selectedOption = question.options.find(opt => opt._id.toString() === response.selectedOption.toString());
      if (!selectedOption) return;
      
      // Apply IRT parameters
      const discrimination = question.metadata?.discrimination || 1.0;
      const difficulty = question.metadata?.difficulty || 0.5;
      
      // Apply trait impact for each dimension affected by this response
      selectedOption.traits.forEach(trait => {
        const { dimension, value, weight } = trait;
        if (traits.hasOwnProperty(dimension)) {
          // 2-Parameter Logistic IRT model calculation
          const baseImpact = discrimination * (value - difficulty);
          const weightedImpact = baseImpact * (weight || 1.0);
          
          traits[dimension] += weightedImpact;
          dimensionCounts[dimension]++;
        }
      });
    });
    
    // Normalize scores to -1 to 1 range
    Object.keys(traits).forEach(dimension => {
      if (dimensionCounts[dimension] > 0) {
        // Normalize and apply sigmoid function to keep within -1 to 1
        const rawScore = traits[dimension] / dimensionCounts[dimension];
        traits[dimension] = 2 * (1 / (1 + Math.exp(-rawScore))) - 1;
      }
    });
    
    return traits;
   };
   module.exports = {
    calculateTraitScores
   };