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

// Track failed login attempts
const failedLoginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const ACCOUNT_LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Clear login attempts periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [username, data] of failedLoginAttempts.entries()) {
    if (now - data.timestamp > ACCOUNT_LOCKOUT_TIME) {
      failedLoginAttempts.delete(username);
    }
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
        // Check if the account is locked
        if (failedLoginAttempts.has(username)) {
          const data = failedLoginAttempts.get(username);
          
          if (data.attempts >= MAX_FAILED_ATTEMPTS) {
            const timeSinceLock = Date.now() - data.timestamp;
            
            if (timeSinceLock < ACCOUNT_LOCKOUT_TIME) {
              const minutesLeft = Math.ceil((ACCOUNT_LOCKOUT_TIME - timeSinceLock) / 60000);
              return done(null, false, { 
                message: `Account temporarily locked. Try again in ${minutesLeft} minutes.`,
                locked: true,
                minutesLeft
              });
            } else {
              // Reset attempts after lockout period
              failedLoginAttempts.delete(username);
            }
          }
        }
        
        const user = await storage.getUserByUsername(username);
        
        if (!user || !(await comparePasswords(password, user.password))) {
          // Record failed attempt
          if (!failedLoginAttempts.has(username)) {
            failedLoginAttempts.set(username, { attempts: 1, timestamp: Date.now() });
          } else {
            const data = failedLoginAttempts.get(username);
            failedLoginAttempts.set(username, { 
              attempts: data.attempts + 1, 
              timestamp: Date.now() 
            });
          }
          
          const attemptsRemaining = MAX_FAILED_ATTEMPTS - 
            (failedLoginAttempts.get(username)?.attempts || 0);
          
          return done(null, false, { 
            message: `Invalid username or password. ${attemptsRemaining > 0 ? 
              `${attemptsRemaining} attempts remaining.` : 
              'Account will be temporarily locked.'}`
          });
        }
        
        // Reset failed attempts on successful login
        failedLoginAttempts.delete(username);
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUserById(id);
      
      if (!user) {
        return done(null, false);
      }
      
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration route with validation and rate limiting
  app.post('/api/register', registerLimiter, validateRegistration, async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ 
          error: true,
          message: 'Username already taken' 
        });
      }

      // Check if email already exists
      if (req.body.email) {
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) {
          return res.status(400).json({ 
            error: true,
            message: 'Email already in use' 
          });
        }
      }

      // Create new user with hashed password
      const userData = {
        ...req.body,
        password: await hashPassword(req.body.password),
        lastLogin: new Date(),
        passwordLastChanged: new Date()
      };
      
      const user = await storage.createUser(userData);
      
      // Log in the newly registered user
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Generate JWT token
        const token = generateToken(user);
        
        // Return user data without password and include token
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json({
          user: userWithoutPassword,
          token
        });
      });
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  });

  // Login route with validation and rate limiting
  app.post('/api/login', loginLimiter, validateLogin, (req, res, next) => {
    passport.authenticate('local', async (err, user, info) => {
      if (err) return next(err);
      
      if (!user) {
        // Handle locked accounts
        if (info.locked) {
          return res.status(423).json({ 
            error: true,
            message: info.message,
            locked: true,
            minutesLeft: info.minutesLeft 
          });
        }
        
        return res.status(401).json({ 
          error: true,
          message: info.message || 'Invalid credentials' 
        });
      }
      
      req.login(user, async (err) => {
        if (err) return next(err);
        
        // Update last login time
        try {
          await storage.updateUserProfile(user.id, { lastLogin: new Date() });
        } catch (error) {
          console.error('Failed to update last login time:', error);
          // Non-critical, don't fail the login
        }
        
        // Generate JWT token
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
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });

  // Get current user route (both session and JWT)
  app.get('/api/user', optionalJwtAuth, (req, res) => {
    // Check for JWT authentication
    if (req.user) {
      return res.json(req.user);
    }
    
    // Check for session authentication
    if (req.isAuthenticated()) {
      // Return user data without password
      const { password, ...userWithoutPassword } = req.user;
      return res.json(userWithoutPassword);
    }
    
    return res.status(401).json({ 
      error: true,
      message: 'Not authenticated' 
    });
  });
  
  // Route to refresh JWT token
  app.post('/api/refresh-token', (req, res) => {
    refreshToken(req, res);
  });
  
  // Attach requireAuth middleware to app for use in other routes
  app.use((req, res, next) => {
    req.requireAuth = requireAuth;
    next();
  });
}

module.exports = {
  setupAuth,
  hashPassword,
  comparePasswords
};