const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger').createLogger('password-reset');

/**
 * Password reset routes
 * Handles generating reset tokens, validating them, and updating passwords
 * 
 * @param {Object} storage - Storage interface
 * @returns {Router} Express router
 */
function passwordResetRoutes(storage) {
  const router = express.Router();
  
  // Store tokens in memory for demo, normally this would be in a database
  // Format: { token: { userId, expires, email } }
  const resetTokens = new Map();
  
  // Clean up expired tokens periodically
  setInterval(() => {
    let cleanedCount = 0;
    const now = Date.now();
    
    for (const [token, data] of resetTokens.entries()) {
      if (data.expires < now) {
        resetTokens.delete(token);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired password reset tokens`);
    }
  }, 15 * 60 * 1000); // Every 15 minutes
  
  /**
   * Request a password reset
   * Generates a token and would send an email in a production environment
   */
  router.post(
    '/request-reset', 
    [
      body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: true,
          message: 'Validation error',
          details: errors.array(),
          userMessage: 'Please provide a valid email address.'
        });
      }
      
      const { email } = req.body;
      const maskedEmail = email
        ? email.substring(0, 3) + '***@' + email.split('@')[1]
        : null;
      
      try {
        // Find the user by email
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          // For security, don't reveal if the email exists or not
          logger.info(`Password reset requested for unknown email: ${maskedEmail}`);
          return res.status(200).json({
            message: 'If your email is registered, you will receive reset instructions.'
          });
        }
        
        // Generate a secure token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresIn = 60 * 60 * 1000; // 1 hour
        
        // Store the token
        resetTokens.set(resetToken, {
          userId: user.id,
          email: email,
          expires: Date.now() + expiresIn
        });
        
        // In a real app, send an email with the reset link
        const resetUrl = `/reset-password?token=${resetToken}`;
        logger.info(`Generated password reset token for user: ${user.id}`, { 
          userId: user.id,
          maskedEmail,
          expiresIn: `${expiresIn / 60000} minutes`
        });
        
        // For development, log the reset URL (would be sent via email in production)
        if (process.env.NODE_ENV !== 'production') {
          logger.debug(`Reset URL for development: ${resetUrl}`);
        }
        
        return res.status(200).json({
          message: 'If your email is registered, you will receive reset instructions.',
          // Only include the token in development mode for testing
          ...(process.env.NODE_ENV !== 'production' && { resetToken, resetUrl })
        });
      } catch (error) {
        logger.error('Error requesting password reset', { error, maskedEmail });
        return res.status(500).json({
          error: true,
          message: 'Server error processing reset request',
          userMessage: 'We encountered an error. Please try again later.'
        });
      }
    }
  );
  
  /**
   * Validate a reset token
   * Checks if the token exists and hasn't expired
   */
  router.get('/validate-token/:token', (req, res) => {
    const { token } = req.params;
    const tokenData = resetTokens.get(token);
    
    if (!tokenData || tokenData.expires < Date.now()) {
      logger.warn(`Invalid or expired reset token attempted: ${token.substring(0, 8)}...`);
      return res.status(400).json({
        error: true,
        valid: false,
        message: 'Invalid or expired token',
        userMessage: 'Your password reset link has expired or is invalid. Please request a new one.'
      });
    }
    
    return res.status(200).json({
      valid: true,
      message: 'Token is valid'
    });
  });
  
  /**
   * Reset a password with a valid token
   */
  router.post(
    '/reset-password',
    [
      body('token')
        .not().isEmpty()
        .withMessage('Reset token is required'),
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: true,
          message: 'Validation error',
          details: errors.array(),
          userMessage: errors.array()[0].msg
        });
      }
      
      const { token, password } = req.body;
      const tokenData = resetTokens.get(token);
      
      if (!tokenData || tokenData.expires < Date.now()) {
        logger.warn(`Invalid or expired reset token used for password reset: ${token.substring(0, 8)}...`);
        return res.status(400).json({
          error: true,
          message: 'Invalid or expired token',
          userMessage: 'Your password reset link has expired or is invalid. Please request a new one.'
        });
      }
      
      try {
        // Hash the new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Update the user's password in the database
        await storage.updateUserProfile(tokenData.userId, {
          password: hashedPassword,
          passwordLastChanged: new Date()
        });
        
        // Remove the used token
        resetTokens.delete(token);
        
        logger.info(`Password successfully reset for user: ${tokenData.userId}`);
        
        return res.status(200).json({
          message: 'Password reset successful',
          userMessage: 'Your password has been reset successfully. You can now log in with your new password.'
        });
      } catch (error) {
        logger.error('Error resetting password', { error, userId: tokenData?.userId });
        return res.status(500).json({
          error: true,
          message: 'Server error processing password reset',
          userMessage: 'We encountered an error. Please try again later.'
        });
      }
    }
  );
  
  return router;
}

module.exports = passwordResetRoutes;