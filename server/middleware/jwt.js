/**
 * JWT authentication middleware for the NewsGeo application
 * Provides JSON Web Token generation and verification for API authentication
 */

const jwt = require('jsonwebtoken');

// Secret key for JWT signing and verification
// In production, this should be set via environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'newsgeo-jwt-secret-key';
const JWT_EXPIRY = '24h'; // Token validity period

/**
 * Generate a JWT token for a user
 * 
 * @param {Object} user - User object to encode in the token
 * @returns {string} JWT token
 */
function generateToken(user) {
  // Only include necessary user data in the token payload
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    // Add other fields as needed, but avoid sensitive information
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Middleware to verify JWT token in authorization header
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function verifyToken(req, res, next) {
  // Get the authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      error: true,
      message: 'No authorization token provided'
    });
  }
  
  // Extract the token (format should be "Bearer TOKEN")
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({
      error: true,
      message: 'Invalid authorization format, expected "Bearer TOKEN"'
    });
  }
  
  const token = tokenParts[1];
  
  // Verify the token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: true,
          message: 'Token expired',
          expired: true
        });
      }
      
      return res.status(401).json({
        error: true,
        message: 'Invalid token'
      });
    }
    
    // Store the decoded user in the request for later use
    req.user = decoded;
    next();
  });
}

/**
 * Middleware to optionally verify JWT token
 * This doesn't require authentication but attaches user data if token is valid
 * Useful for endpoints that work differently for authenticated and anonymous users
 */
function optionalJwtAuth(req, res, next) {
  // Get the authorization header
  const authHeader = req.headers.authorization;
  
  // If no header is present, continue as anonymous
  if (!authHeader) {
    return next();
  }
  
  // Extract the token (format should be "Bearer TOKEN")
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return next();
  }
  
  const token = tokenParts[1];
  
  // Verify the token but don't block on failure
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err) {
      // Store the decoded user in the request
      req.user = decoded;
    }
    next();
  });
}

/**
 * Refresh a JWT token if it's still valid
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function refreshToken(req, res) {
  // Get the authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      error: true,
      message: 'No authorization token provided'
    });
  }
  
  // Extract the token
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({
      error: true,
      message: 'Invalid authorization format, expected "Bearer TOKEN"'
    });
  }
  
  const token = tokenParts[1];
  
  // Verify the token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: true,
          message: 'Token expired',
          expired: true
        });
      }
      
      return res.status(401).json({
        error: true,
        message: 'Invalid token'
      });
    }
    
    // Generate a new token
    const newToken = jwt.sign({
      id: decoded.id,
      username: decoded.username,
      email: decoded.email
    }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    
    // Return the new token
    res.json({
      token: newToken,
      expiresIn: JWT_EXPIRY,
      user: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email
      }
    });
  });
}

module.exports = {
  generateToken,
  verifyToken,
  optionalJwtAuth,
  refreshToken
};