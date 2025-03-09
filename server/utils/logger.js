/**
 * Logger utility for the NewsGeo application
 * Provides consistent logging format and log levels
 */

// Available log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Current log level (can be changed dynamically)
let currentLogLevel = process.env.LOG_LEVEL || LOG_LEVELS.INFO;

/**
 * Format a log message
 * 
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 * @param {string} source - Source of the log (function/module name)
 * @returns {string} Formatted log message
 */
function formatLog(level, message, data = null, source = null) {
  const timestamp = new Date().toISOString();
  const sourceInfo = source ? `[${source}]` : '';
  
  let logMessage = `${timestamp} ${level} ${sourceInfo} ${message}`;
  
  if (data) {
    // Handle Error objects specially
    if (data instanceof Error) {
      logMessage += `\n  Error: ${data.message}`;
      if (data.stack) {
        logMessage += `\n  Stack: ${data.stack}`;
      }
    } else if (typeof data === 'object') {
      try {
        // Try to stringify the object, but handle circular references
        logMessage += `\n  Data: ${JSON.stringify(data, (key, value) => {
          if (key === 'password' || key === 'token') return '[REDACTED]';
          return value;
        }, 2)}`;
      } catch (e) {
        logMessage += `\n  Data: [Object cannot be stringified: ${e.message}]`;
      }
    } else {
      logMessage += `\n  Data: ${data}`;
    }
  }
  
  return logMessage;
}

/**
 * Check if a log level should be logged based on current log level
 * 
 * @param {string} level - Log level to check
 * @returns {boolean} Whether the log level should be logged
 */
function shouldLog(level) {
  const logLevels = Object.values(LOG_LEVELS);
  const currentIdx = logLevels.indexOf(currentLogLevel);
  const levelIdx = logLevels.indexOf(level);
  
  return levelIdx <= currentIdx;
}

/**
 * Log an error message
 * 
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 * @param {string} source - Source of the log (function/module name)
 */
function error(message, data = null, source = null) {
  if (shouldLog(LOG_LEVELS.ERROR)) {
    console.error(formatLog(LOG_LEVELS.ERROR, message, data, source));
  }
}

/**
 * Log a warning message
 * 
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 * @param {string} source - Source of the log (function/module name)
 */
function warn(message, data = null, source = null) {
  if (shouldLog(LOG_LEVELS.WARN)) {
    console.warn(formatLog(LOG_LEVELS.WARN, message, data, source));
  }
}

/**
 * Log an info message
 * 
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 * @param {string} source - Source of the log (function/module name)
 */
function info(message, data = null, source = null) {
  if (shouldLog(LOG_LEVELS.INFO)) {
    console.log(formatLog(LOG_LEVELS.INFO, message, data, source));
  }
}

/**
 * Log a debug message
 * 
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 * @param {string} source - Source of the log (function/module name)
 */
function debug(message, data = null, source = null) {
  if (shouldLog(LOG_LEVELS.DEBUG)) {
    console.log(formatLog(LOG_LEVELS.DEBUG, message, data, source));
  }
}

/**
 * Set the current log level
 * 
 * @param {string} level - New log level
 */
function setLogLevel(level) {
  if (Object.values(LOG_LEVELS).includes(level)) {
    currentLogLevel = level;
    info(`Log level set to ${level}`, null, 'logger');
  } else {
    warn(`Invalid log level: ${level}. Valid levels are: ${Object.values(LOG_LEVELS).join(', ')}`, null, 'logger');
  }
}

/**
 * Create a logger instance for a specific source
 * 
 * @param {string} source - Source name for the logger
 * @returns {Object} Logger instance with source pre-filled
 */
function createLogger(source) {
  return {
    error: (message, data = null) => error(message, data, source),
    warn: (message, data = null) => warn(message, data, source),
    info: (message, data = null) => info(message, data, source),
    debug: (message, data = null) => debug(message, data, source)
  };
}

module.exports = {
  LOG_LEVELS,
  error,
  warn,
  info,
  debug,
  setLogLevel,
  createLogger
};