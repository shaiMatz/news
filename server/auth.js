const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cookie = require('cookie-parser');

// Import our security middleware
const { 
  setupSecurityMiddleware, 
  loginLimiter, 
  registerLimiter,
  validateRegistration,
  validateLogin,
  requireAuth
} = require('./middleware/security');

// Import JWT functionality
const { 
  generateToken,
  verifyToken,
  optionalJwtAuth,
  refreshToken
} = require('./middleware/jwt');

// Import logger
const logger = require('./utils/logger').createLogger('auth');

// Track failed login attempts
const failedLoginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const ACCOUNT_LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Clear login attempts periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  logger.debug('Running login attempts cleanup check');
  
  for (const [username, data] of failedLoginAttempts.entries()) {
    if (now - data.timestamp > ACCOUNT_LOCKOUT_TIME) {
      logger.debug('Cleaning up expired login attempt record', { 
        username: username.substring(0, 3) + '***', // Log partial username for privacy
        attempts: data.attempts,
        age: Math.floor((now - data.timestamp) / 1000) + 's'
      });
      failedLoginAttempts.delete(username);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.info(`Cleaned up ${cleanedCount} expired login attempt records`);
  }
}, 10 * 60 * 1000); // Clean up every 10 minutes

// Hash a password using bcrypt (more secure than crypto)
async function hashPassword(password) {
  const saltRounds = 12; // Higher is more secure but slower
  return await bcrypt.hash(password, saltRounds);
}

// Compare a password against a stored hash
async function comparePasswords(supplied, stored) {
  return await bcrypt.compare(supplied, stored);
}

// Setup authentication for Express app
function setupAuth(app, storage) {
  // Apply security middleware
  setupSecurityMiddleware(app);
  
  // Add cookie parsing
  app.use(cookie());
  
  // Configure session middleware with secure settings
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || 'newsgeo-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true, // Prevent JavaScript access to cookies
      secure: process.env.NODE_ENV === 'production', // Require HTTPS in production
      sameSite: 'lax', // Protection against CSRF
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    }
  };

  app.set('trust proxy', 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport with local strategy and account lockout
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Mask username for logging to protect privacy (show first 3 chars)
        const maskedUsername = username.substring(0, 3) + '***';
        logger.debug('Login attempt', { username: maskedUsername });
        
        // Check if the account is locked
        if (failedLoginAttempts.has(username)) {
          const data = failedLoginAttempts.get(username);
          
          if (data.attempts >= MAX_FAILED_ATTEMPTS) {
            const timeSinceLock = Date.now() - data.timestamp;
            
            if (timeSinceLock < ACCOUNT_LOCKOUT_TIME) {
              const minutesLeft = Math.ceil((ACCOUNT_LOCKOUT_TIME - timeSinceLock) / 60000);
              logger.warn('Login attempt for locked account', { 
                username: maskedUsername, 
                attempts: data.attempts,
                minutesLeft
              });
              
              return done(null, false, { 
                message: `Account temporarily locked. Try again in ${minutesLeft} minutes.`,
                locked: true,
                minutesLeft
              });
            } else {
              // Reset attempts after lockout period
              logger.info('Lockout period expired, resetting attempts', { username: maskedUsername });
              failedLoginAttempts.delete(username);
            }
          }
        }
        
        const user = await storage.getUserByUsername(username);
        
        if (!user || !(await comparePasswords(password, user.password))) {
          // Record failed attempt
          let newAttemptCount = 1;
          
          if (!failedLoginAttempts.has(username)) {
            failedLoginAttempts.set(username, { attempts: 1, timestamp: Date.now() });
          } else {
            const data = failedLoginAttempts.get(username);
            newAttemptCount = data.attempts + 1;
            failedLoginAttempts.set(username, { 
              attempts: newAttemptCount, 
              timestamp: Date.now() 
            });
          }
          
          const attemptsRemaining = MAX_FAILED_ATTEMPTS - newAttemptCount;
          
          logger.warn('Failed login attempt', { 
            username: maskedUsername, 
            attempts: newAttemptCount,
            remainingAttempts: attemptsRemaining,
            willLock: attemptsRemaining <= 0
          });
          
          return done(null, false, { 
            message: `Invalid username or password. ${attemptsRemaining > 0 ? 
              `${attemptsRemaining} attempts remaining.` : 
              'Account will be temporarily locked.'}`
          });
        }
        
        // Reset failed attempts on successful login
        if (failedLoginAttempts.has(username)) {
          logger.info('Resetting failed login attempts after successful login', { 
            username: maskedUsername 
          });
          failedLoginAttempts.delete(username);
        }
        
        logger.info('Successful login', { 
          userId: user.id, 
          username: maskedUsername
        });
        
        return done(null, user);
      } catch (error) {
        logger.error('Error during authentication', error);
        return done(error);
      }
    })
  );

  // Serialize user to session
  passport.serializeUser((user, done) => {
    logger.debug('Serializing user to session', { userId: user.id });
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      logger.debug('Deserializing user from session', { userId: id });
      
      const user = await storage.getUserById(id);
      
      if (!user) {
        logger.warn('User not found during session deserialization', { userId: id });
        return done(null, false);
      }
      
      done(null, user);
    } catch (error) {
      logger.error('Error deserializing user from session', { userId: id, error });
      done(error);
    }
  });

  // Registration route with validation and rate limiting
  app.post('/api/register', registerLimiter, validateRegistration, async (req, res, next) => {
    const maskedUsername = req.body.username?.substring(0, 3) + '***';
    const maskedEmail = req.body.email 
      ? req.body.email.substring(0, 3) + '***@' + req.body.email.split('@')[1]
      : null;
    
    logger.info('New user registration attempt', { 
      username: maskedUsername, 
      email: maskedEmail,
      ip: req.ip
    });
    
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        logger.warn('Registration failed - username already taken', { 
          username: maskedUsername,
          ip: req.ip
        });
        return res.status(400).json({ 
          error: true,
          message: 'Username already taken' 
        });
      }

      // Check if email already exists
      if (req.body.email) {
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) {
          logger.warn('Registration failed - email already in use', { 
            email: maskedEmail,
            ip: req.ip
          });
          return res.status(400).json({ 
            error: true,
            message: 'Email already in use' 
          });
        }
      }

      // Create new user with hashed password
      logger.debug('Hashing password for new user');
      const userData = {
        ...req.body,
        password: await hashPassword(req.body.password),
        lastLogin: new Date(),
        passwordLastChanged: new Date()
      };
      
      logger.debug('Creating new user in database');
      const user = await storage.createUser(userData);
      logger.info('User created successfully', { userId: user.id, username: maskedUsername });
      
      // Log in the newly registered user
      req.login(user, (err) => {
        if (err) {
          logger.error('Error during auto-login after registration', { error: err, userId: user.id });
          return next(err);
        }
        
        // Generate JWT token
        logger.debug('Generating JWT token for new user', { userId: user.id });
        const token = generateToken(user);
        
        // Return user data without password and include token
        const { password, ...userWithoutPassword } = user;
        logger.info('Registration complete with auto-login', { userId: user.id });
        return res.status(201).json({
          user: userWithoutPassword,
          token
        });
      });
    } catch (error) {
      logger.error('Registration error', { error, username: maskedUsername });
      next(error);
    }
  });

  // Login route with validation and rate limiting
  app.post('/api/login', loginLimiter, validateLogin, (req, res, next) => {
    const maskedUsername = req.body.username?.substring(0, 3) + '***';
    
    logger.info('Login attempt', { 
      username: maskedUsername,
      ip: req.ip
    });
    
    passport.authenticate('local', async (err, user, info) => {
      if (err) {
        logger.error('Authentication error during login', { error: err, username: maskedUsername });
        return next(err);
      }
      
      if (!user) {
        // Handle locked accounts
        if (info.locked) {
          logger.warn('Login attempt for locked account', { 
            username: maskedUsername,
            minutesLeft: info.minutesLeft,
            ip: req.ip
          });
          
          return res.status(423).json({ 
            error: true,
            message: info.message,
            locked: true,
            minutesLeft: info.minutesLeft 
          });
        }
        
        logger.warn('Failed login attempt - invalid credentials', { 
          username: maskedUsername,
          ip: req.ip,
          message: info.message
        });
        
        return res.status(401).json({ 
          error: true,
          message: info.message || 'Invalid credentials' 
        });
      }
      
      req.login(user, async (err) => {
        if (err) {
          logger.error('Error during login session creation', { error: err, userId: user.id });
          return next(err);
        }
        
        logger.info('User logged in successfully', { 
          userId: user.id,
          username: maskedUsername 
        });
        
        // Update last login time
        try {
          logger.debug('Updating last login time', { userId: user.id });
          await storage.updateUserProfile(user.id, { lastLogin: new Date() });
        } catch (error) {
          logger.warn('Failed to update last login time', { error, userId: user.id });
          // Non-critical, don't fail the login
        }
        
        // Generate JWT token
        logger.debug('Generating JWT token', { userId: user.id });
        const token = generateToken(user);
        
        // Return user data without password and include token
        const { password, ...userWithoutPassword } = user;
        return res.json({
          user: userWithoutPassword,
          token
        });
      });
    })(req, res, next);
  });

  // Logout route
  app.post('/api/logout', (req, res, next) => {
    const userId = req.user?.id;
    
    if (userId) {
      logger.info('User logout', { userId });
    } else {
      logger.debug('Logout attempt for unauthenticated session', { ip: req.ip });
    }
    
    req.logout((err) => {
      if (err) {
        logger.error('Error during logout', { error: err, userId });
        return next(err);
      }
      
      logger.debug('Session destroyed successfully', { userId });
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });

  // Get current user route (both session and JWT)
  app.get('/api/user', optionalJwtAuth, (req, res) => {
    // Check for JWT authentication
    if (req.user) {
      logger.debug('User authenticated via JWT', { userId: req.user.id });
      return res.json(req.user);
    }
    
    // Check for session authentication
    if (req.isAuthenticated()) {
      logger.debug('User authenticated via session', { userId: req.user.id });
      // Return user data without password
      const { password, ...userWithoutPassword } = req.user;
      return res.json(userWithoutPassword);
    }
    
    logger.debug('Unauthenticated access to /api/user', { ip: req.ip });
    return res.status(401).json({ 
      error: true,
      message: 'Not authenticated' 
    });
  });
  
  // Route to refresh JWT token
  app.post('/api/refresh-token', (req, res) => {
    const userId = req.user?.id;
    
    if (userId) {
      logger.debug('Token refresh request', { userId });
    } else {
      logger.debug('Unauthenticated token refresh attempt', { ip: req.ip });
    }
    
    refreshToken(req, res);
  });
  
  // Attach requireAuth middleware to app for use in other routes
  app.use((req, res, next) => {
    logger.debug('Setting up requireAuth middleware for routes');
    req.requireAuth = requireAuth;
    next();
  });
}

module.exports = {
  setupAuth,
  hashPassword,
  comparePasswords
};