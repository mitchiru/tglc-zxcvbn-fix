/**
 * zxcvbn-ts Compatibility Wrapper for WordPress
 * 
 * This wrapper maintains compatibility with the original zxcvbn API
 * while using the secure zxcvbn-ts v3.0.4 library internally.
 * 
 * Original API: zxcvbn(password, user_inputs)
 * Returns: { score: 0-4, ... }
 */

import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';

// Initialize zxcvbn-ts with default options
// We'll use the common package which includes the most common dictionaries
import { dictionary, adjacencyGraphs } from '@zxcvbn-ts/language-common';

// Set up zxcvbn-ts options
const options = {
  dictionary: {
    ...dictionary,
  },
  graphs: adjacencyGraphs,
};

zxcvbnOptions.setOptions(options);

/**
 * WordPress-compatible zxcvbn function
 * 
 * @param {string} password - The password to analyze
 * @param {Array} userInputs - Array of user-specific words to penalize
 * @returns {Object} - Result object with score and other properties
 */
function wordpressZxcvbn(password, userInputs = []) {
  // Ensure userInputs is an array
  if (!Array.isArray(userInputs)) {
    userInputs = userInputs ? [userInputs.toString()] : [];
  }
  
  // Filter out empty or very short user inputs (< 4 chars) as WordPress does
  const filteredUserInputs = userInputs.filter(input => {
    return input && typeof input === 'string' && input.length >= 4;
  });
  
  try {
    // Call zxcvbn-ts with the password and user inputs
    const result = zxcvbn(password, filteredUserInputs);
    
    // Return an object that matches the original zxcvbn API
    return {
      score: result.score,
      guesses: result.guesses,
      guesses_log10: result.guessesLog10,
      sequence: result.sequence,
      crack_times_seconds: result.crackTimesSeconds,
      crack_times_display: result.crackTimesDisplay,
      feedback: result.feedback
    };
  } catch (error) {
    console.error('zxcvbn-ts error:', error);
    // Return a safe fallback that indicates unknown strength
    return {
      score: -1,
      guesses: 0,
      guesses_log10: 0,
      sequence: [],
      crack_times_seconds: {},
      crack_times_display: {},
      feedback: {
        warning: '',
        suggestions: []
      }
    };
  }
}

// Make the function available globally as window.zxcvbn
// This maintains compatibility with WordPress's password strength meter
if (typeof window !== 'undefined') {
  window.zxcvbn = wordpressZxcvbn;
}

// Also export for module systems
export default wordpressZxcvbn;
