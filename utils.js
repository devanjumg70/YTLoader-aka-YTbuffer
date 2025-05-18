/**
 * Utility functions for the YouTube Complete Buffer extension
 */

/**
 * Logger - Handles logging with different levels
 * Can be enabled/disabled via configuration
 */
const logger = {
  enabled: true,  // Always enabled for better visibility
  
  log: function(...args) {
    if (this.enabled) {
      console.log('%c[YT Buffer]', 'background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;', ...args);
    }
  },
  
  info: function(...args) {
    if (this.enabled) {
      console.info('%c[YT Buffer]', 'background: #2196F3; color: white; padding: 2px 4px; border-radius: 2px;', ...args);
    }
  },
  
  warn: function(...args) {
    if (this.enabled) {
      console.warn('%c[YT Buffer]', 'background: #FFC107; color: black; padding: 2px 4px; border-radius: 2px;', ...args);
    }
  },
  
  error: function(...args) {
    if (this.enabled) {
      console.error('%c[YT Buffer]', 'background: #F44336; color: white; padding: 2px 4px; border-radius: 2px;', ...args);
    }
  }
};

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit how often a function is called
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - The throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Make functions available globally for other scripts
window.logger = logger;
window.debounce = debounce;
window.throttle = throttle;