/**
 * Security middleware configuration for the NewsGeo application
 * Implements various security measures like rate limiting, security headers, and CSRF protection
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const csrf = require('csurf');
const { body, validationResult } = require('express-validator');

// Create rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many login attempts, please try again after 15 minutes' }
});

// Create rate limiter for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many registration attempts, please try again after an hour' }
});

// Create general API rate limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many requests, please try again later' }
});

// CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

// Validation rules for user registration
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores and hyphens')
    .trim()
    .escape(),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation rules for login
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .trim()
    .escape(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Authentication check middleware
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      error: true, 
      message: 'Authentication required' 
    });
  }
  next();
};

// Apply security middleware to Express app
function setupSecurityMiddleware(app) {
  // Add security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Necessary for development, restrict in production
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSockets
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // For development
    crossOriginOpenerPolicy: false,    // For development
    crossOriginResourcePolicy: false,  // For development
  }));
  
  // Add X-Powered-By removal
  app.disable('x-powered-by');
  
  // Log all successful logins and failed attempts (for security auditing)
  app.use((req, res, next) => {
    const end = res.end;
    res.end = function() {
      // Log login attempts
      if (req.path === '/api/login') {
        if (res.statusCode === 200) {
          console.log(`Successful login: ${req.body.username} from ${req.ip}`);
        } else if (res.statusCode === 401) {
          console.log(`Failed login attempt: ${req.body.username} from ${req.ip}`);
        }
      }
      
      // Continue with normal response ending
      return end.apply(this, arguments);
    };
    next();
  });
}

module.exports = {
  setupSecurityMiddleware,
  loginLimiter,
  registerLimiter,
  apiLimiter,
  csrfProtection,
  validateRegistration,
  validateLogin,
  requireAuth
};