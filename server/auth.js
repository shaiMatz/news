const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcrypt');
const cookie = require('cookie-parser');

const {
  setupSecurityMiddleware,
  loginLimiter,
  registerLimiter,
  validateRegistration,
  validateLogin,
  requireAuth
} = require('./middleware/security');

const {
  generateToken,
  verifyToken,
  optionalJwtAuth,
  refreshToken
} = require('./middleware/jwt');

const logger = require('./utils/logger').createLogger('auth');

// Track failed login attempts
const failedLoginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const ACCOUNT_LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Periodically clear expired login attempt records
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  logger.debug('Running login attempts cleanup check');
  for (const [username, data] of failedLoginAttempts.entries()) {
    if (now - data.timestamp > ACCOUNT_LOCKOUT_TIME) {
      logger.debug('Cleaning up expired login attempt record', {
        username: username.substring(0, 3) + '***',
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
}, 10 * 60 * 1000);

async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function comparePasswords(supplied, stored) {
  return await bcrypt.compare(supplied, stored);
}

function setupAuth(app, storage) {
  // Apply security middleware and cookie parser
  app.use(cookie());

  // Instead of reinitializing session, just initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  setupSecurityMiddleware(app);


  // Configure Passport LocalStrategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const maskedUsername = username.substring(0, 3) + '***';
        logger.debug('Login attempt', { username: maskedUsername });

        if (failedLoginAttempts.has(username)) {
          const data = failedLoginAttempts.get(username);
          if (data.attempts >= MAX_FAILED_ATTEMPTS) {
            const timeSinceLock = Date.now() - data.timestamp;
            if (timeSinceLock < ACCOUNT_LOCKOUT_TIME) {
              const minutesLeft = Math.ceil((ACCOUNT_LOCKOUT_TIME - timeSinceLock) / 60000);
              logger.warn('Login attempt for locked account', { username: maskedUsername, attempts: data.attempts, minutesLeft });
              return done(null, false, {
                message: `Account temporarily locked. Try again in ${minutesLeft} minutes.`,
                locked: true,
                minutesLeft
              });
            } else {
              logger.info('Lockout period expired, resetting attempts', { username: maskedUsername });
              failedLoginAttempts.delete(username);
            }
          }
        }

        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          let newAttemptCount = 1;
          if (!failedLoginAttempts.has(username)) {
            failedLoginAttempts.set(username, { attempts: 1, timestamp: Date.now() });
          } else {
            const data = failedLoginAttempts.get(username);
            newAttemptCount = data.attempts + 1;
            failedLoginAttempts.set(username, { attempts: newAttemptCount, timestamp: Date.now() });
          }
          const attemptsRemaining = MAX_FAILED_ATTEMPTS - newAttemptCount;
          logger.warn('Failed login attempt', { username: maskedUsername, attempts: newAttemptCount, remainingAttempts: attemptsRemaining, willLock: attemptsRemaining <= 0 });
          return done(null, false, {
            message: `Invalid username or password. ${attemptsRemaining > 0 ?
              `${attemptsRemaining} attempts remaining.` :
              'Account will be temporarily locked.'}`
          });
        }

        if (failedLoginAttempts.has(username)) {
          logger.info('Resetting failed login attempts after successful login', { username: maskedUsername });
          failedLoginAttempts.delete(username);
        }

        logger.info('Successful login', { userId: user.id, username: maskedUsername });
        return done(null, user);
      } catch (error) {
        logger.error('Error during authentication', error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    logger.debug('Serializing user to session', { userId: user.id });
    done(null, user.id);
  });

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

  // Registration route
  app.post('/api/register', registerLimiter, validateRegistration, async (req, res, next) => {
    const maskedUsername = req.body.username?.substring(0, 3) + '***';
    const maskedEmail = req.body.email
      ? req.body.email.substring(0, 3) + '***@' + req.body.email.split('@')[1]
      : null;

    logger.info('New user registration attempt', { username: maskedUsername, email: maskedEmail, ip: req.ip });

    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        logger.warn('Registration failed - username already taken', { username: maskedUsername, ip: req.ip });
        return res.status(400).json({ error: true, message: 'Username already taken' });
      }

      if (req.body.email) {
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) {
          logger.warn('Registration failed - email already in use', { email: maskedEmail, ip: req.ip });
          return res.status(400).json({ error: true, message: 'Email already in use' });
        }
      }

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

      req.login(user, (err) => {
        if (err) {
          logger.error('Error during auto-login after registration', { error: err, userId: user.id });
          return next(err);
        }
        logger.debug('Generating JWT token for new user', { userId: user.id });
        const token = generateToken(user);
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

  // Login route
  app.post('/api/login', loginLimiter, validateLogin, (req, res, next) => {
    const maskedUsername = req.body.username?.substring(0, 3) + '***';
    logger.info('Login attempt', { username: maskedUsername, ip: req.ip });
    passport.authenticate('local', async (err, user, info) => {
      if (err) {
        logger.error('Authentication error during login', { error: err, username: maskedUsername });
        return next(err);
      }
      if (!user) {
        if (info.locked) {
          logger.warn('Login attempt for locked account', { username: maskedUsername, minutesLeft: info.minutesLeft, ip: req.ip });
          return res.status(423).json({
            error: true,
            message: info.message,
            locked: true,
            minutesLeft: info.minutesLeft
          });
        }
        logger.warn('Failed login attempt - invalid credentials', { username: maskedUsername, ip: req.ip, message: info.message });
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
        logger.info('User logged in successfully', { userId: user.id, username: maskedUsername });
        try {
          logger.debug('Updating last login time', { userId: user.id });
          await storage.updateUserProfile(user.id, { lastLogin: new Date() });
        } catch (error) {
          logger.warn('Failed to update last login time', { error, userId: user.id });
        }
        logger.debug('Generating JWT token', { userId: user.id });
        const token = generateToken(user);
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

  // Get current user route (session or JWT)
  app.get('/api/user', optionalJwtAuth, (req, res) => {
    if (req.user) {
      logger.debug('User authenticated via JWT', { userId: req.user.id });
      return res.json(req.user);
    }
    if (req.isAuthenticated()) {
      logger.debug('User authenticated via session', { userId: req.user.id });
      const { password, ...userWithoutPassword } = req.user;
      return res.json(userWithoutPassword);
    }
    logger.debug('Unauthenticated access to /api/user', { ip: req.ip });
    return res.status(401).json({ error: true, message: 'Not authenticated' });
  });

  // Refresh JWT token
  app.post('/api/refresh-token', (req, res) => {
    const userId = req.user?.id;
    if (userId) {
      logger.debug('Token refresh request', { userId });
    } else {
      logger.debug('Unauthenticated token refresh attempt', { ip: req.ip });
    }
    refreshToken(req, res);
  });

  // Social login route for Google, Apple, etc.
  app.post('/api/social-login', async (req, res, next) => {
    try {
      const { provider, token, device } = req.body;
      
      if (!provider || !token) {
        logger.warn('Invalid social login request - missing provider or token', { ip: req.ip });
        return res.status(400).json({
          error: true,
          message: 'Provider and token are required'
        });
      }

      logger.info('Social login attempt', { provider, device, ip: req.ip });

      // Verify the token with the appropriate provider
      let userInfo;
      
      if (provider === 'google') {
        try {
          // Verify the token with Google OAuth API - production-ready implementation
          const axios = require('axios');
          const { GOOGLE_CLIENT_ID } = process.env;
          
          // Log redacted client ID for debugging (security best practice)
          const redactedClientId = GOOGLE_CLIENT_ID 
            ? `${GOOGLE_CLIENT_ID.substring(0, 6)}...${GOOGLE_CLIENT_ID.substring(GOOGLE_CLIENT_ID.length - 4)}`
            : 'Not configured';
          logger.debug('Using Google client ID for verification', { clientId: redactedClientId });
          
          if (!GOOGLE_CLIENT_ID) {
            logger.error('Google login configuration error - Missing CLIENT_ID env variable');
            throw new Error('Server configuration error - Google authentication not properly configured');
          }
          
          // Verify the token with Google's token info endpoint
          const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`;
          logger.debug('Verifying Google token with Google API', { tokenLength: token.length });
          
          // Add timeout and validation for security
          const response = await axios.get(tokenInfoUrl, { 
            timeout: 5000,
            validateStatus: status => status === 200
          });
          const tokenData = response.data;
          
          // Enhanced security validation checks
          
          // 1. Validate the token's audience matches our client ID
          if (tokenData.aud !== GOOGLE_CLIENT_ID) {
            logger.warn('Google token validation failed - client ID mismatch', {
              expected: redactedClientId,
              received: tokenData.aud ? `${tokenData.aud.substring(0, 6)}...` : 'Missing'
            });
            throw new Error('Token was not issued for this application');
          }
          
          // 2. Check token has not expired
          const currentTime = Math.floor(Date.now() / 1000);
          if (tokenData.exp && currentTime > tokenData.exp) {
            logger.warn('Google token validation failed - token expired', {
              tokenExp: tokenData.exp,
              currentTime,
              diffSeconds: currentTime - tokenData.exp
            });
            throw new Error('Token has expired');
          }
          
          // 3. Check token issuer is Google
          if (tokenData.iss !== 'https://accounts.google.com' && 
              tokenData.iss !== 'accounts.google.com') {
            logger.warn('Google token validation failed - invalid issuer', {
              issuer: tokenData.iss
            });
            throw new Error('Token was not issued by Google');
          }
          
          // 4. Ensure token has not been used before valid start time
          if (tokenData.iat && currentTime < tokenData.iat) {
            logger.warn('Google token validation failed - used before issue time', {
              issuedAt: tokenData.iat,
              currentTime,
              diffSeconds: tokenData.iat - currentTime
            });
            throw new Error('Token is not yet valid');
          }
          
          // 5. Only accept emails that have been verified by Google
          if (tokenData.email_verified !== 'true' && tokenData.email_verified !== true) {
            logger.warn('Google login attempt with unverified email', { 
              email: tokenData.email ? `${tokenData.email.substring(0, 3)}***@${tokenData.email.split('@')[1]}` : 'Missing email'
            });
            throw new Error('Email address not verified with Google');
          }
          
          // Log successful verification
          logger.debug('Google token verified successfully', { 
            sub: tokenData.sub,
            email: tokenData.email ? `${tokenData.email.substring(0, 3)}***@${tokenData.email.split('@')[1]}` : 'Unknown',
            name: tokenData.name ? `${tokenData.name.split(' ')[0][0]}***` : 'Unknown',
            emailVerified: tokenData.email_verified
          });
          
          // Store important user information for account creation/login
          userInfo = {
            providerId: tokenData.sub,
            email: tokenData.email,
            name: tokenData.name || '',
            picture: tokenData.picture || '',
            locale: tokenData.locale || 'en',
            // Additional profile data from Google can be added here
            verifiedEmail: !!tokenData.email_verified
          };
          
        } catch (error) {
          logger.error('Failed to verify Google token', { error: error.message });
          return res.status(401).json({
            error: true,
            message: 'Invalid authentication token'
          });
        }
      } else if (provider === 'apple') {
        // Apple token verification would go here
        logger.warn('Apple login not fully implemented', { ip: req.ip });
        return res.status(501).json({
          error: true,
          message: 'Apple login is not currently supported'
        });
      } else {
        logger.warn('Unsupported social login provider', { provider, ip: req.ip });
        return res.status(400).json({
          error: true,
          message: 'Unsupported authentication provider'
        });
      }

      // Look for existing user with this provider ID or email
      let user = null;
      
      // Try to find by email
      if (userInfo.email) {
        user = await storage.getUserByEmail(userInfo.email);
      }
      
      // If user doesn't exist, create a new one
      if (!user) {
        logger.info('Creating new user from social login', { 
          provider, 
          email: userInfo.email
        });
        
        // Generate a secure random password for the account
        // (user won't know this password but can reset it if needed)
        const randomPassword = require('crypto')
          .randomBytes(16)
          .toString('hex');
        
        const userData = {
          username: userInfo.email.split('@')[0] + '_' + Date.now().toString().slice(-4),
          email: userInfo.email,
          password: await hashPassword(randomPassword),
          name: userInfo.name || '',
          profilePicture: userInfo.picture || '',
          providerType: provider,
          providerId: userInfo.providerId,
          lastLogin: new Date(),
          passwordLastChanged: new Date()
        };
        
        user = await storage.createUser(userData);
        logger.info('Social login user created', { userId: user.id, provider });
      } else {
        logger.info('Found existing user for social login', { 
          userId: user.id, 
          provider
        });
        
        // Update the user's profile with latest provider data
        logger.debug('Updating user profile with latest provider data', { userId: user.id });
        
        // Only update fields that exist in the user profile
        const updateData = { 
          lastLogin: new Date(),
          providerType: provider,
          providerId: userInfo.providerId
        };
        
        // Conditionally update additional profile information
        if (userInfo.picture && userInfo.picture !== user.profilePicture) {
          updateData.profilePicture = userInfo.picture;
          logger.debug('Updating user profile picture', { userId: user.id });
        }
        
        if (userInfo.name && userInfo.name !== user.name) {
          updateData.name = userInfo.name;
          logger.debug('Updating user name', { userId: user.id });
        }
        
        // Store authentication timestamp for security auditing
        updateData.lastProviderAuthAt = new Date();
        
        // Apply the profile updates
        await storage.updateUserProfile(user.id, updateData);
      }

      // Generate a JWT token for the user
      logger.debug('Generating JWT token for social login', { userId: user.id });
      const jwtToken = generateToken(user);
      
      // Log the user in via the session as well
      req.login(user, (err) => {
        if (err) {
          logger.error('Error during social login session creation', { error: err, userId: user.id });
          return next(err);
        }
        
        logger.info('Social login successful', { userId: user.id, provider });
        const { password, ...userWithoutPassword } = user;
        return res.json({
          user: userWithoutPassword,
          token: jwtToken
        });
      });
    } catch (error) {
      logger.error('Social login error', { error });
      next(error);
    }
  });

  // Attach requireAuth middleware for other routes
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
