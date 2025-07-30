/**
 * WordPress Password Strength Compatibility Layer
 * 
 * This ensures wp.passwordStrength.meter is always available,
 * even if zxcvbn hasn't loaded yet. It provides a fallback
 * and then upgrades to the real implementation once zxcvbn loads.
 */

(function() {
  'use strict';
  
  // Ensure wp namespace exists
  window.wp = window.wp || {};
  
  // Create a fallback password strength meter
  var fallbackMeter = function(password1, disallowedList, password2) {
    // Handle password mismatch
    if (password1 != password2 && password2 && password2.length > 0) {
      return 5; // Mismatch
    }
    
    // If zxcvbn is available, use it
    if (typeof window.zxcvbn === 'function') {
      try {
        if (!Array.isArray(disallowedList)) {
          disallowedList = disallowedList ? [disallowedList.toString()] : [];
        }
        var result = window.zxcvbn(password1, disallowedList);
        return result.score;
      } catch (error) {
        console.error('zxcvbn error:', error);
      }
    }
    
    // Fallback scoring if zxcvbn isn't available
    if (!password1 || password1.length === 0) {
      return 0;
    }
    
    var score = 0;
    var length = password1.length;
    
    // Length scoring
    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    
    // Character variety scoring
    var hasLower = /[a-z]/.test(password1);
    var hasUpper = /[A-Z]/.test(password1);
    var hasNumbers = /[0-9]/.test(password1);
    var hasSymbols = /[^a-zA-Z0-9]/.test(password1);
    
    var charTypes = 0;
    if (hasLower) charTypes++;
    if (hasUpper) charTypes++;
    if (hasNumbers) charTypes++;
    if (hasSymbols) charTypes++;
    
    if (charTypes >= 3) score += 1;
    if (charTypes >= 4) score += 1;
    
    // Check against disallowed list
    if (disallowedList && disallowedList.length > 0) {
      var lowerPassword = password1.toLowerCase();
      for (var i = 0; i < disallowedList.length; i++) {
        var disallowed = disallowedList[i];
        if (disallowed && typeof disallowed === 'string' && disallowed.length >= 4) {
          if (lowerPassword.indexOf(disallowed.toLowerCase()) !== -1) {
            score = Math.max(0, score - 1);
          }
        }
      }
    }
    
    // Common patterns penalty
    if (/^[0-9]+$/.test(password1)) score = Math.max(0, score - 1); // All numbers
    if (/^[a-zA-Z]+$/.test(password1)) score = Math.max(0, score - 1); // All letters
    
    // Common passwords penalty
    var commonPasswords = ['password', '123456', '123456789', 'qwerty', 'abc123'];
    var lowerPass = password1.toLowerCase();
    for (var j = 0; j < commonPasswords.length; j++) {
      if (lowerPass === commonPasswords[j] || lowerPass.indexOf(commonPasswords[j]) !== -1) {
        score = 0;
        break;
      }
    }
    
    return Math.min(4, Math.max(0, score));
  };
  
  // Create userInputDisallowedList function (from WordPress password-strength-meter.js)
  var userInputDisallowedList = function() {
    var i, userInputFieldsLength, rawValuesLength, currentField,
        rawValues       = [],
        disallowedList  = [],
        userInputFields = [ 'user_login', 'first_name', 'last_name', 'nickname', 'display_name', 'email', 'url', 'description', 'weblog_title', 'admin_email' ];

    // Collect all the strings we want to disallow.
    rawValues.push( document.title );
    rawValues.push( document.URL );

    userInputFieldsLength = userInputFields.length;
    for ( i = 0; i < userInputFieldsLength; i++ ) {
      currentField = window.jQuery ? window.jQuery( '#' + userInputFields[ i ] ) : null;

      if ( !currentField || currentField.length === 0 ) {
        continue;
      }

      if (currentField[0] && currentField[0].defaultValue) {
        rawValues.push( currentField[0].defaultValue );
      }
      if (currentField.val && typeof currentField.val === 'function') {
        rawValues.push( currentField.val() );
      }
    }

    /*
     * Strip out non-alphanumeric characters and convert each word to an
     * individual entry.
     */
    rawValuesLength = rawValues.length;
    for ( i = 0; i < rawValuesLength; i++ ) {
      if ( rawValues[ i ] ) {
        disallowedList = disallowedList.concat( rawValues[ i ].replace( /\W/g, ' ' ).split( ' ' ) );
      }
    }

    /*
     * Remove empty values, short words and duplicates. Short words are likely to
     * cause many false positives.
     */
    var filteredList = [];
    for (i = 0; i < disallowedList.length; i++) {
      var value = disallowedList[i];
      if (value && value.length >= 4 && filteredList.indexOf(value) === -1) {
        filteredList.push(value);
      }
    }

    return filteredList;
  };

  // Set up wp.passwordStrength if it doesn't exist
  if (!window.wp.passwordStrength) {
    window.wp.passwordStrength = {
      meter: fallbackMeter,
      userInputDisallowedList: userInputDisallowedList,
      // Backward compatibility
      userInputBlacklist: function() {
        if (window.console && window.console.log) {
          window.console.log('wp.passwordStrength.userInputBlacklist() is deprecated since version 5.5.0! Use wp.passwordStrength.userInputDisallowedList() instead.');
        }
        return userInputDisallowedList();
      }
    };
  } else {
    if (!window.wp.passwordStrength.meter) {
      window.wp.passwordStrength.meter = fallbackMeter;
    }
    if (!window.wp.passwordStrength.userInputDisallowedList) {
      window.wp.passwordStrength.userInputDisallowedList = userInputDisallowedList;
    }
    if (!window.wp.passwordStrength.userInputBlacklist) {
      window.wp.passwordStrength.userInputBlacklist = function() {
        if (window.console && window.console.log) {
          window.console.log('wp.passwordStrength.userInputBlacklist() is deprecated since version 5.5.0! Use wp.passwordStrength.userInputDisallowedList() instead.');
        }
        return userInputDisallowedList();
      };
    }
  }
  
  // If zxcvbnReady is available, upgrade when zxcvbn loads
  if (typeof window.zxcvbnReady === 'function') {
    window.zxcvbnReady(function() {
      console.log('zxcvbn loaded - wp.passwordStrength.meter upgraded');
      // The meter function will now use the loaded zxcvbn automatically
    });
  }
  
})();
