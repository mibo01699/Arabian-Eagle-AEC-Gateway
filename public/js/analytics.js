/**
 * Vercel Web Analytics - Initialization Script
 * This script injects the Vercel Analytics tracker into the application.
 */

// Import the inject function from @vercel/analytics
// Since this is a browser script, we'll use the inline approach
(function() {
  'use strict';
  
  // Initialize the analytics queue
  window.va = window.va || function() {
    (window.vaq = window.vaq || []).push(arguments);
  };
  
  // Inject the analytics script
  var script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  
  // Append to head or body
  var firstScript = document.getElementsByTagName('script')[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
})();
