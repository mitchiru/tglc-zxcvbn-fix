/**
 * Secure Async Loader for zxcvbn-ts
 * 
 * This replaces WordPress's vulnerable zxcvbn-async.js with a secure version
 * that loads our zxcvbn-ts bundle asynchronously.
 * 
 * Maintains the same loading pattern as the original for compatibility.
 */

/* global _zxcvbnSettings */

/**
 * Loads zxcvbn-ts bundle asynchronously by inserting an async script tag
 * before the first script tag on the page.
 *
 * This ensures zxcvbn-ts doesn't block page loading as it is a substantial library.
 * The source URL is read from the _zxcvbnSettings global variable.
 */
(function() {
  'use strict';
  
  var isLoaded = false;
  var isLoading = false;
  var callbacks = [];
  
  /**
   * Execute all queued callbacks once zxcvbn is loaded
   */
  function executeCallbacks() {
    while (callbacks.length > 0) {
      var callback = callbacks.shift();
      try {
        callback();
      } catch (error) {
        console.error('zxcvbn callback error:', error);
      }
    }
  }
  
  /**
   * Check if zxcvbn is available and execute callbacks
   */
  function checkAndExecute() {
    if (typeof window.zxcvbn === 'function') {
      isLoaded = true;
      isLoading = false;
      executeCallbacks();
    } else {
      // Check again in 50ms if not loaded yet
      setTimeout(checkAndExecute, 50);
    }
  }
  
  /**
   * Load the zxcvbn-ts bundle asynchronously
   */
  function asyncLoad() {
    if (isLoaded || isLoading) {
      return;
    }
    
    // Check if _zxcvbnSettings is available
    if (typeof _zxcvbnSettings === 'undefined' || !_zxcvbnSettings.src) {
      console.error('zxcvbn-ts: _zxcvbnSettings not found or missing src');
      return;
    }
    
    isLoading = true;
    
    var script = document.createElement('script');
    script.src = _zxcvbnSettings.src;
    script.type = 'text/javascript';
    script.async = true;
    
    // Add load event listener
    script.onload = function() {
      checkAndExecute();
    };
    
    // Add error handler
    script.onerror = function() {
      console.error('Failed to load zxcvbn-ts bundle from:', _zxcvbnSettings.src);
      isLoading = false;
    };
    
    // Insert before the first script tag
    var firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      // Fallback: append to head
      document.head.appendChild(script);
    }
  }
  
  /**
   * Public API to queue callbacks that should run when zxcvbn is ready
   */
  window.zxcvbnReady = function(callback) {
    if (typeof callback !== 'function') {
      return;
    }
    
    if (isLoaded && typeof window.zxcvbn === 'function') {
      // Already loaded, execute immediately
      try {
        callback();
      } catch (error) {
        console.error('zxcvbn callback error:', error);
      }
    } else {
      // Queue for later execution
      callbacks.push(callback);
      
      // Start loading if not already started
      if (!isLoading) {
        asyncLoad();
      }
    }
  };
  
  // Start loading immediately - don't wait for DOM ready
  // This ensures zxcvbn is available as soon as possible for other scripts
  asyncLoad();

  // Also set up fallback loading for different DOM states
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (!isLoaded && !isLoading) {
        asyncLoad();
      }
    });
  }
  
})();
