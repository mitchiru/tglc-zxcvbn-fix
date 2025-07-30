const fs = require('fs');
const path = require('path');
const UglifyJS = require('uglify-js');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

console.log('Building zxcvbn-ts bundles...');

// Build the WordPress compatibility layer
console.log('1. Building wp-password-strength-compat.min.js...');

const compatContent = fs.readFileSync(path.join(__dirname, 'src', 'wp-password-strength-compat.js'), 'utf8');
const compatMinified = UglifyJS.minify(compatContent);
if (compatMinified.error) {
  console.error('Error minifying compatibility layer:', compatMinified.error);
  process.exit(1);
}

fs.writeFileSync(
  path.join(distDir, 'wp-password-strength-compat.min.js'),
  compatMinified.code
);

console.log('✓ wp-password-strength-compat.min.js created');

// Build the async loader
console.log('2. Building zxcvbn-async-secure.min.js...');

// Since we can't use ES6 imports with Node 8, we'll create a CommonJS version
const zxcvbnWrapperContent = `
// zxcvbn-ts Compatibility Wrapper for WordPress
(function() {
  'use strict';
  
  // Load zxcvbn-ts modules
  var zxcvbnCore = require('@zxcvbn-ts/core');
  var languageCommon = require('@zxcvbn-ts/language-common');
  
  // Set up zxcvbn-ts options
  var options = {
    dictionary: languageCommon.dictionary,
    graphs: languageCommon.adjacencyGraphs,
  };
  
  zxcvbnCore.zxcvbnOptions.setOptions(options);
  
  // WordPress-compatible zxcvbn function
  function wordpressZxcvbn(password, userInputs) {
    userInputs = userInputs || [];
    
    // Ensure userInputs is an array
    if (!Array.isArray(userInputs)) {
      userInputs = userInputs ? [userInputs.toString()] : [];
    }
    
    // Filter out empty or very short user inputs (< 4 chars) as WordPress does
    var filteredUserInputs = userInputs.filter(function(input) {
      return input && typeof input === 'string' && input.length >= 4;
    });
    
    try {
      // Call zxcvbn-ts with the password and user inputs
      var result = zxcvbnCore.zxcvbn(password, filteredUserInputs);
      
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
  if (typeof window !== 'undefined') {
    window.zxcvbn = wordpressZxcvbn;
  }
  
})();
`;

// For now, let's create a simpler version that doesn't require bundling
// We'll create a standalone version that includes the necessary parts
const standaloneWrapper = fs.readFileSync(path.join(__dirname, 'src', 'zxcvbn-async-secure.js'), 'utf8');

// Write the async loader (minified)
const asyncLoaderMinified = UglifyJS.minify(standaloneWrapper);
if (asyncLoaderMinified.error) {
  console.error('Error minifying async loader:', asyncLoaderMinified.error);
  process.exit(1);
}

fs.writeFileSync(
  path.join(distDir, 'zxcvbn-async-secure.min.js'),
  asyncLoaderMinified.code
);

console.log('✓ zxcvbn-async-secure.min.js created');

// For the main bundle, we'll create a placeholder that will be replaced with the actual bundle
const placeholderBundle = `
console.log('zxcvbn-ts bundle placeholder - this should be replaced with the actual bundle');
// This is a placeholder. The actual implementation will be added in the next step.
window.zxcvbn = function(password, userInputs) {
  console.warn('zxcvbn-ts not yet fully loaded');
  return { score: -1 };
};
`;

fs.writeFileSync(
  path.join(distDir, 'zxcvbn-ts-bundle.min.js'),
  placeholderBundle
);

console.log('✓ zxcvbn-ts-bundle.min.js placeholder created');
console.log('Build complete! Files created in dist/ directory');
