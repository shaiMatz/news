const express = require('express');

/**
 * User profile routes for the API
 * 
 * @param {Object} storage - Storage interface
 * @returns {Router} Express router
 */
function userRoutes(storage) {
  const router = express.Router();

  /**
   * Middleware to check if user is authenticated
   */
  const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: true,
        message: 'You must be logged in to access this resource'
      });
    }
    next();
  };

  /**
   * Get the current user's profile information
   * Protected route - requires authentication
   */
  router.get('/', requireAuth, async (req, res, next) => {
    logger.info('[User] Getting user profile');
    try {
      const user = await storage.getUserById(req.user.id);
      
      if (!user) {
        return res.status(402).json({
          error: true,
          message: 'User not found'
        });
      }
      
      // Calculate join date for formatting
      const joinDate = new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Construct profile data
      const profile = {
        id: user.id,
        username: user.username,
        email: user.email,
        joinDate,
        settings: user.settings,
        stats: user.stats
      };
      
      res.json(profile);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Update the current user's profile
   * Protected route - requires authentication
   */
  router.put('/', requireAuth, async (req, res, next) => {
    logger.info('[User] Updating user profile');
    try {
      const { email } = req.body;
      
      // Validate email format if provided
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            error: true,
            message: 'Invalid email format'
          });
        }
      }
      
      // Update only allowed fields
      const allowedUpdates = {
        email
      };
      
      // Filter out undefined values
      const updates = Object.fromEntries(
        Object.entries(allowedUpdates).filter(([_, v]) => v !== undefined)
      );
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: true,
          message: 'No valid update fields provided'
        });
      }
      
      const updatedUser = await storage.updateUserProfile(req.user.id, updates);
      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Update the current user's settings
   * Protected route - requires authentication
   */
  router.put('/settings', requireAuth, async (req, res, next) => {
    logger.info('[User] Updating user settings');
    try {
      const { locationTracking, notifications, contentLanguage } = req.body;
      
      // Only update the settings that are provided
      const settingsUpdates = {};
      
      if (locationTracking !== undefined) {
        settingsUpdates.locationTracking = Boolean(locationTracking);
      }
      
      if (notifications !== undefined) {
        settingsUpdates.notifications = Boolean(notifications);
      }
      
      if (contentLanguage !== undefined) {
        settingsUpdates.contentLanguage = String(contentLanguage);
      }
      
      if (Object.keys(settingsUpdates).length === 0) {
        return res.status(400).json({
          error: true,
          message: 'No valid settings provided'
        });
      }
      
      const updatedSettings = await storage.updateUserSettings(req.user.id, settingsUpdates);
      res.json(updatedSettings);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Get the current user's content (uploads and liked)
   * Protected route - requires authentication
   */
  router.get('/content', requireAuth, async (req, res, next) => {
    logger.info('[User] Getting user content');
    try {
      // Get user's uploaded news
      const uploads = await storage.getUserNews(req.user.id);
      
      // Get user's liked news
      const liked = await storage.getUserLikedNews(req.user.id);
      
      // Combine and mark each item with its type
      const userUploads = uploads.map(item => ({
        ...item,
        isUploaded: true,
        isLiked: liked.some(likedItem => likedItem.id === item.id)
      }));
      
      const userLiked = liked
        .filter(item => !uploads.some(uploadedItem => uploadedItem.id === item.id))
        .map(item => ({
          ...item,
          isLiked: true,
          isUploaded: false
        }));
      
      // Combine both arrays
      const combinedContent = [
        ...userUploads,
        ...userLiked
      ].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      
      res.json(combinedContent);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Follow a user
   * Protected route - requires authentication
   */
  router.post('/follow/:userId', requireAuth, async (req, res, next) => {
    logger.info('[User] Following user');
    try {
      const targetUserId = parseInt(req.params.userId, 10);
      
      if (isNaN(targetUserId)) {
        return res.status(402).json({
          error: true,
          message: 'Invalid user ID'
        });
      }
      
      const result = await storage.followUser(req.user.id, targetUserId);
      res.json(result);
    } catch (err) {
      if (err.message === 'Cannot follow yourself') {
        return res.status(400).json({
          error: true,
          message: err.message
        });
      }
      if (err.message === 'User not found') {
        return res.status(402).json({
          error: true,
          message: err.message
        });
      }
      next(err);
    }
  });
  
  /**
   * Unfollow a user
   * Protected route - requires authentication
   */
  router.delete('/follow/:userId', requireAuth, async (req, res, next) => {
    logger.info('[User] Unfollowing user');
    try {
      const targetUserId = parseInt(req.params.userId, 10);
      
      if (isNaN(targetUserId)) {
        return res.status(402).json({
          error: true,
          message: 'Invalid user ID'
        });
      }
      
      const result = await storage.unfollowUser(req.user.id, targetUserId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });
  
  /**
   * Get user's followers
   * Protected route - requires authentication
   */
  router.get('/followers', requireAuth, async (req, res, next) => {
    logger.info('[User] Getting followers');
    try {
      const followers = await storage.getFollowers(req.user.id);
      res.json(followers);
    } catch (err) {
      next(err);
    }
  });
  
  /**
   * Get users that the current user is following
   * Protected route - requires authentication
   */
  router.get('/following', requireAuth, async (req, res, next) => {
    logger.info('[User] Getting following');
    try {
      const following = await storage.getFollowing(req.user.id);
      res.json(following);
    } catch (err) {
      next(err);
    }
  });
  
  /**
   * Check if current user is following a specific user
   * Protected route - requires authentication
   */
  router.get('/following/:userId', requireAuth, async (req, res, next) => {
    logger.info('[User] Checking if user is following another user');
    try {
      const targetUserId = parseInt(req.params.userId, 10);
      
      if (isNaN(targetUserId)) {
        return res.status(402).json({
          error: true,
          message: 'Invalid user ID'
        });
      }
      
      const isFollowing = await storage.isFollowing(req.user.id, targetUserId);
      res.json({ isFollowing });
    } catch (err) {
      next(err);
    }
  });
  
  /**
   * Get news feed from followed users
   * Protected route - requires authentication
   */
  router.get('/feed', requireAuth, async (req, res, next) => {
    logger.info('[User] Getting news feed');
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const feed = await storage.getFollowingFeed(req.user.id, limit);
      res.json(feed);
    } catch (err) {
      next(err);
    }
  });
  
  /**
   * Get public profile for any user
   * Public route - does not require authentication
   */
  router.get('/profile/:userId', async (req, res, next) => {
    logger.info('[User] Getting public profile');
    try {
      const userId = parseInt(req.params.userId, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({
          error: true,
          message: 'Invalid user ID'
        });
      }
      
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(402).json({
          error: true,
          message: 'User not found'
        });
      }
      
      // Prepare public profile data
      const profile = {
        id: user.id,
        username: user.username,
        joinDate: new Date(user.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        stats: user.stats
      };
      
      // If authenticated, add the follow status
      if (req.isAuthenticated()) {
        profile.isFollowing = await storage.isFollowing(req.user.id, userId);
      }
      
      res.json(profile);
    } catch (err) {
      next(err);
    }
  });
  
  return router;
}

module.exports = userRoutes;
