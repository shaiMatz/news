/**
 * Security middleware configuration for the NewsGeo application
 * Implements various security measures like rate limiting, security headers, and CSRF protection
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const csrf = require('csurf');
const { body, validationResult } = require('express-validator');

// Import logger
const logger = require('../utils/logger').createLogger('security');

// Create rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many login attempts, please try again after 15 minutes' },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded for login', { 
      ip: req.ip, 
      path: req.path, 
      headers: req.headers['user-agent']
    });
    res.status(options.statusCode).json(options.message);
  }
});

// Create rate limiter for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many registration attempts, please try again after an hour' },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded for registration', { 
      ip: req.ip, 
      path: req.path, 
      headers: req.headers['user-agent']
    });
    res.status(options.statusCode).json(options.message);
  }
});

// Create general API rate limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many requests, please try again later' },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded for API', { 
      ip: req.ip, 
      path: req.path, 
      headers: req.headers['user-agent']
    });
    res.status(options.statusCode).json(options.message);
  }
});

// CSRF protection middleware
const csrfProtection = csrf({ 
  cookie: true,
  value: (req) => {
    logger.debug('Checking CSRF token');
    return req.headers['csrf-token'] || req.body._csrf;
  }
});

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
      // Mask username when logging
      const maskedUsername = req.body.username?.substring(0, 3) + '***';
      const maskedEmail = req.body.email 
        ? req.body.email.substring(0, 3) + '***@' + req.body.email.split('@')[1]
        : null;
        
      logger.warn('Registration validation failed', { 
        ip: req.ip,
        username: maskedUsername,
        email: maskedEmail,
        errors: errors.array().map(e => e.param + ': ' + e.msg)
      });
      
      return res.status(400).json({ errors: errors.array() });
    }
    
    logger.debug('Registration validation passed', { 
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
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
      // Mask username when logging
      const maskedUsername = req.body.username?.substring(0, 3) + '***';
      
      logger.warn('Login validation failed', { 
        ip: req.ip,
        username: maskedUsername,
        errors: errors.array().map(e => e.param + ': ' + e.msg)
      });
      
      return res.status(400).json({ errors: errors.array() });
    }
    
    logger.debug('Login validation passed', { 
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    next();
  }
];

// Authentication check middleware
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    logger.warn('Unauthorized access attempt', { 
      ip: req.ip, 
      path: req.path,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(401).json({ 
      error: true, 
      message: 'Authentication required' 
    });
  }
  
  logger.debug('Authorized access', { 
    userId: req.user.id,
    path: req.path
  });
  
  next();
};

// Apply security middleware to Express app
function setupSecurityMiddleware(app) {
  logger.info('Setting up security middleware');
  
  // Add security headers
  logger.debug('Configuring helmet security headers');
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
  logger.debug('Removing X-Powered-By header');
  app.disable('x-powered-by');
  
  // Log HTTP requests for security analysis
  logger.debug('Setting up request logger for security auditing');
  app.use((req, res, next) => {
    // Log sensitive routes access
    const sensitiveRoutes = ['/api/user', '/api/admin', '/api/settings'];
    if (sensitiveRoutes.some(route => req.path.startsWith(route))) {
      logger.debug('Sensitive route access', { 
        path: req.path, 
        method: req.method, 
        ip: req.ip,
        authenticated: req.isAuthenticated()
      });
    }
    
    // Track response for later logging
    const end = res.end;
    res.end = function() {
      // We use our logger instead of console.log now
      if (req.path === '/api/login') {
        const maskedUsername = req.body?.username ? req.body.username.substring(0, 3) + '***' : 'unknown';
        
        if (res.statusCode === 200) {
          logger.info('Login successful', { 
            username: maskedUsername, 
            ip: req.ip,
            userAgent: req.headers['user-agent']
          });
        } else if (res.statusCode === 401) {
          logger.warn('Failed login attempt', { 
            username: maskedUsername, 
            ip: req.ip,
            userAgent: req.headers['user-agent']
          });
        }
      }
      
      // Log failed requests for security analysis
      if (res.statusCode >= 400) {
        logger.debug(`HTTP ${res.statusCode} response`, { 
          path: req.path, 
          method: req.method, 
          ip: req.ip,
          statusCode: res.statusCode
        });
      }
      
      // Continue with normal response ending
      return end.apply(this, arguments);
    };
    
    next();
  });
  
  logger.info('Security middleware setup complete');
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