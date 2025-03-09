const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');

// Convert callback-based scrypt to Promise-based
const scryptAsync = promisify(scrypt);

/**
 * Set up authentication for the Express app
 * 
 * @param {Object} app - Express app instance
 * @param {Object} storage - Storage interface
 */
function setupAuth(app, storage) {
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Set up the local strategy for username/password authentication
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      // Find the user by username
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      
      // Check if the password is correct
      const isPasswordValid = await comparePasswords(password, user.password);
      
      if (!isPasswordValid) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      
      // Remove password before returning user object
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (err) {
      return done(err);
    }
  }));

  // Serialize user for the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUserById(id);
      if (!user) {
        return done(null, false);
      }
      
      // Remove password before returning user object
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (err) {
      done(err);
    }
  });

  // Routes for authentication
  app.post('/api/register', async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      
      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ 
          error: true, 
          message: 'Username, email, and password are required' 
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: true,
          message: 'Please provide a valid email address'
        });
      }
      
      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({
          error: true,
          message: 'Password must be at least 6 characters long'
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ 
          error: true, 
          message: 'Username already exists' 
        });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ 
          error: true, 
          message: 'Email already in use' 
        });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create the user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        createdAt: new Date()
      });
      
      // Remove password before returning user object
      const { password: _, ...userWithoutPassword } = user;
      
      // Log the user in
      req.login(userWithoutPassword, (err) => {
        if (err) {
          return next(err);
        }
        return res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      console.error('Registration error:', err);
      next(err);
    }
  });

  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error('Authentication error:', err);
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({
          error: true,
          message: info.message || 'Invalid username or password'
        });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return next(err);
        }
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post('/api/logout', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(200).json({ success: true });
    }
    
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({
          error: true,
          message: 'Failed to log out'
        });
      }
      
      res.json({ success: true });
    });
  });

  app.get('/api/user', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: true,
        message: 'Not authenticated'
      });
    }
    
    res.json(req.user);
  });

  // Authentication middleware for routes
  const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: true,
        message: 'Authentication required'
      });
    }
    next();
  };

  // Make auth middleware available
  app.use((req, res, next) => {
    req.requireAuth = requireAuth;
    next();
  });
}

/**
 * Hash a password
 * 
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Compare a password against a stored hash
 * 
 * @param {string} supplied - Supplied password to check
 * @param {string} stored - Stored password hash
 * @returns {Promise<boolean>} Whether the password is valid
 */
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  
  try {
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (err) {
    console.error('Error comparing passwords:', err);
    return false;
  }
}

/**
 * Verify a password against a stored hash
 * 
 * @param {string} password - Plain text password to verify
 * @param {string} storedPassword - Stored password hash
 * @returns {Promise<boolean>} Whether the password is valid
 */
async function verifyPassword(password, storedPassword) {
  return comparePasswords(password, storedPassword);
}

module.exports = { 
  setupAuth,
  hashPassword,
  verifyPassword 
};
