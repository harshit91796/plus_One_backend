 /**
 * Assigns a personality label based on trait scores
 * @param {Object} traits - Calculated trait scores
 * @returns {Object} Personality label and description
 */
 const assignPersonalityLabel = (traits) => {
    // Define thresholds for considering a trait "high" or "low"
    const HIGH_THRESHOLD = 0.4;
    const LOW_THRESHOLD = -0.4;
    
    // Check for dominant trait patterns
    if (traits.extraversion > HIGH_THRESHOLD && traits.openness > HIGH_THRESHOLD) {
      return {
        label: "Charismatic Explorer",
        description: "You're outgoing, adventurous, and love discovering new experiences. " +
                    "Your enthusiasm inspires others, and you thrive on social connection and novel situations."
      };
    }
    
    if (traits.conscientiousness > HIGH_THRESHOLD && traits.emotionalStability > HIGH_THRESHOLD) {
      return {
        label: "Reliable Pillar",
        description: "You're organized, dependable, and maintain composure under pressure. " +
                    "People trust you to follow through on commitments and provide stability in chaotic situations."
      };
    }
    
    if (traits.openness > HIGH_THRESHOLD && traits.creativity > HIGH_THRESHOLD) {
      return {
        label: "Visionary Innovator",
        description: "You see possibilities others miss and generate unique ideas and perspectives. " +
                    "Your imagination and intellectual curiosity drive you to challenge conventional thinking."
      };
    }
    
    if (traits.agreeableness > HIGH_THRESHOLD && traits.emotionalStability > HIGH_THRESHOLD) {
      return {
        label: "Compassionate Diplomat",
        description: "You prioritize harmony and understand others' emotions. Your natural empathy " +
                    "and calm approach make you excellent at resolving conflicts and supporting friends."
      };
    }
    
    if (traits.extraversion > HIGH_THRESHOLD && traits.adaptability > HIGH_THRESHOLD) {
      return {
        label: "Dynamic Catalyst",
        description: "You energize groups and adapt quickly to changing circumstances. " +
                    "Your flexibility and sociability make you thrive in dynamic environments."
      };
    }
    
    if (traits.conscientiousness > HIGH_THRESHOLD && traits.creativity > HIGH_THRESHOLD) {
      return {
        label: "Methodical Innovator",
        description: "You combine structure with imagination, creating practical yet original solutions. " +
                    "You excel at turning creative ideas into reality through careful execution."
      };
    }
    
    if (traits.openness > HIGH_THRESHOLD && traits.emotionalStability > HIGH_THRESHOLD) {
      return {
        label: "Philosophical Observer",
        description: "You approach life with curiosity and emotional balance. " +
                    "Your thoughtful perspective and calm demeanor help you see situations clearly."
      };
    }
    
    // Default case if no strong pattern is detected
    return {
      label: "Balanced Individual",
      description: "You show adaptability across different situations without extreme tendencies. " +
                  "Your balanced approach allows you to connect with diverse people and handle various challenges."
    };
   };
   module.exports = {
    assignPersonalityLabel
   };