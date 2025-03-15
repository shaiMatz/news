/**
 * Utilities for standardized error handling across the app
 */

/**
 * Error types for categorizing different error scenarios
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK',        // Network connectivity issues
  SERVER: 'SERVER',          // Server errors (500s)
  AUTH: 'AUTH',              // Authentication issues (401, 403)
  VALIDATION: 'VALIDATION',  // Input validation failures
  NOT_FOUND: 'NOT_FOUND',    // Resource not found (404)
  TIMEOUT: 'TIMEOUT',        // Request timeouts
  UNKNOWN: 'UNKNOWN',        // Uncategorized errors
  PERMISSION: 'PERMISSION',  // Permission-related errors
  CONFIG: 'CONFIG'           // Configuration or API key errors
};

/**
 * Friendly error messages that can be displayed to the user
 */
export const ErrorMessages = {
  [ErrorTypes.NETWORK]: 'Can\'t connect to the network. Please check your connection and try again.',
  [ErrorTypes.SERVER]: 'The server encountered an error. Please try again later.',
  [ErrorTypes.AUTH]: 'Authentication failed. Please sign in again.',
  [ErrorTypes.VALIDATION]: 'Please check your input and try again.',
  [ErrorTypes.NOT_FOUND]: 'The requested information could not be found.',
  [ErrorTypes.TIMEOUT]: 'The request took too long to complete. Please try again.',
  [ErrorTypes.PERMISSION]: 'You don\'t have permission to perform this action.',
  [ErrorTypes.CONFIG]: 'The application is missing required configuration settings.',
  [ErrorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

/**
 * Parse error to identify the type of error
 * 
 * @param {Error|Object|string} error - The error object or message
 * @returns {string} The error type from ErrorTypes
 */
export function getErrorType(error) {
  // Handle network errors
  if (!error) return ErrorTypes.UNKNOWN;
  
  if (
    error.message?.includes('network') ||
    error.message?.includes('Network') ||
    error.message?.includes('connection') ||
    error.name === 'NetworkError' ||
    error.code === 'NETWORK_ERROR' ||
    error.name === 'AbortError' ||
    error.message?.includes('Failed to fetch')
  ) {
    return ErrorTypes.NETWORK;
  }
  
  // Check for timeout errors
  if (
    error.message?.includes('timeout') ||
    error.message?.includes('timed out') ||
    error.code === 'TIMEOUT'
  ) {
    return ErrorTypes.TIMEOUT;
  }
  
  // Check for server errors (HTTP 5xx)
  if (
    error.status >= 500 || 
    error.statusCode >= 500 ||
    error.message?.includes('server error')
  ) {
    return ErrorTypes.SERVER;
  }
  
  // Check for authentication errors
  if (
    error.status === 401 || 
    error.statusCode === 401 ||
    error.status === 403 || 
    error.statusCode === 403 ||
    error.message?.includes('unauthorized') ||
    error.message?.includes('forbidden') ||
    error.message?.includes('auth') ||
    error.code === 'AUTH_ERROR'
  ) {
    return ErrorTypes.AUTH;
  }
  
  // Check for validation errors
  if (
    error.status === 400 || 
    error.statusCode === 400 ||
    error.message?.includes('validation') ||
    error.message?.includes('invalid') ||
    error.code === 'VALIDATION_ERROR' ||
    error.type === 'ValidationError'
  ) {
    return ErrorTypes.VALIDATION;
  }
  
  // Check for not found errors
  if (
    error.status === 402 || 
    error.statusCode === 402 ||
    error.message?.includes('not found') ||
    error.code === 'NOT_FOUND_ERROR'
  ) {
    return ErrorTypes.NOT_FOUND;
  }
  
  // Check for permission errors
  if (
    error.message?.includes('permission') ||
    error.message?.includes('access denied') ||
    error.code === 'PERMISSION_ERROR'
  ) {
    return ErrorTypes.PERMISSION;
  }
  
  // Default to unknown
  return ErrorTypes.UNKNOWN;
}

/**
 * Get a user-friendly error message for an error
 * 
 * @param {Error|Object|string} error - The error object or message
 * @param {Object} customMessages - Optional custom messages to override defaults
 * @returns {string} A user-friendly error message
 */
export function getUserFriendlyMessage(error, customMessages = {}) {
  if (!error) return ErrorMessages[ErrorTypes.UNKNOWN];
  
  // If error is a string, return it directly if it seems user-friendly,
  // otherwise categorize it and get the standard message
  if (typeof error === 'string') {
    if (error.length < 100 && !error.includes('Error:') && !error.includes('Exception')) {
      return error;
    }
    // Fall through to categorization
  }
  
  // For API errors that already have a user message
  if (error.userMessage) {
    return error.userMessage;
  }
  
  // For server responses with message field
  if (error.data?.message && typeof error.data.message === 'string') {
    return error.data.message;
  }
  
  // For validation errors with details
  if (error.validationErrors || error.errors) {
    const validationErrors = error.validationErrors || error.errors;
    
    // If it's an array of error messages, return the first one
    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      const firstError = validationErrors[0];
      if (typeof firstError === 'string') return firstError;
      if (firstError.message) return firstError.message;
    }
    
    // If it's an object with field names as keys, return the first error message
    if (typeof validationErrors === 'object') {
      const fieldNames = Object.keys(validationErrors);
      if (fieldNames.length > 0) {
        const firstErrorMessage = validationErrors[fieldNames[0]];
        if (typeof firstErrorMessage === 'string') return firstErrorMessage;
        if (Array.isArray(firstErrorMessage) && firstErrorMessage.length > 0) {
          return firstErrorMessage[0];
        }
      }
    }
  }
  
  // Categorize the error and get standard message
  const errorType = getErrorType(error);
  
  // Use custom message if available, otherwise use standard message
  return customMessages[errorType] || ErrorMessages[errorType] || ErrorMessages[ErrorTypes.UNKNOWN];
}

/**
 * Log error details for debugging
 * 
 * @param {Error|Object|string} error - The error to log
 * @param {string} source - Where the error occurred (component or function name)
 */
export function logError(error, source = null) {
  const logPrefix = source ? `[${source}]` : '';
  const errorType = getErrorType(error);
  
  console.error(`${logPrefix} Error (${errorType}):`, error);
  
  // Additional logging for specific error types
  if (errorType === ErrorTypes.NETWORK) {
    console.info(`${logPrefix} Network status should be checked.`);
  } else if (errorType === ErrorTypes.AUTH) {
    console.info(`${logPrefix} User may need to reauthenticate.`);
  }
  
  // If available, log status code and response data
  if (error.status || error.statusCode) {
    console.error(`${logPrefix} Status code:`, error.status || error.statusCode);
  }
  
  if (error.data) {
    console.error(`${logPrefix} Response data:`, error.data);
  }
}

/**
 * Combine error logging and message formatting into a single function
 * 
 * @param {Error|Object|string} error - The error object or message
 * @param {string} source - Where the error occurred
 * @param {Object} customMessages - Optional custom messages
 * @returns {string} A user-friendly error message
 */
export function handleError(error, source = null, customMessages = {}) {
  logError(error, source);
  return getUserFriendlyMessage(error, customMessages);
}