const express = require('express');

/**
 * News routes for the API
 * 
 * @param {Object} storage - Storage interface
 * @returns {Router} Express router
 */
function newsRoutes(storage) {
  const router = express.Router();

  /**
   * Middleware to check if user is authenticated
   * Used for routes that require authentication
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
   * Get all news or filter by location
   * Public route - accessible without authentication
   */
  router.get('/', async (req, res, next) => {
    try {
      const { lat, lon } = req.query;
      
      // If lat and lon provided, filter by location
      if (lat && lon) {
        const newsItems = await storage.getNewsByLocation(
          parseFloat(lat),
          parseFloat(lon)
        );
        
        // Enhance news with user-specific data if authenticated
        if (req.isAuthenticated()) {
          const userId = req.user.id;
          newsItems.forEach(news => {
            news.liked = news.likedBy.includes(userId);
          });
        }
        
        return res.json(newsItems);
      }
      
      // Otherwise, get all news
      const newsItems = await storage.getAllNews();
      
      // Enhance news with user-specific data if authenticated
      if (req.isAuthenticated()) {
        const userId = req.user.id;
        newsItems.forEach(news => {
          news.liked = news.likedBy.includes(userId);
        });
      }
      
      res.json(newsItems);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Get a specific news item by ID
   * Public route - accessible without authentication
   */
  router.get('/:id', async (req, res, next) => {
    try {
      const newsId = parseInt(req.params.id);
      const news = await storage.getNewsById(newsId);
      
      if (!news) {
        return res.status(404).json({
          error: true,
          message: 'News not found'
        });
      }
      
      // Track view (only if user is different from author)
      if (req.isAuthenticated() && req.user.id !== news.authorId) {
        await storage.incrementNewsViews(newsId);
      }
      
      // Enhance news with user-specific data if authenticated
      if (req.isAuthenticated()) {
        const userId = req.user.id;
        news.liked = news.likedBy.includes(userId);
      }
      
      res.json(news);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Create a new news item
   * Protected route - requires authentication
   */
  router.post('/', requireAuth, async (req, res, next) => {
    try {
      const { title, description, videoUrl, thumbnail, location, coordinates } = req.body;
      
      // Validate required fields
      if (!title || !description || !videoUrl) {
        return res.status(400).json({
          error: true,
          message: 'Title, description, and video URL are required'
        });
      }
      
      const newsData = {
        title,
        description,
        videoUrl,
        thumbnail,
        location,
        coordinates,
        isLive: req.body.isLive || false
      };
      
      const news = await storage.createNews(newsData, req.user.id);
      
      res.status(201).json(news);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Like or unlike a news item
   * Protected route - requires authentication
   */
  router.post('/:id/like', requireAuth, async (req, res, next) => {
    try {
      const newsId = parseInt(req.params.id);
      const result = await storage.likeNews(newsId, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Get comments for a news item
   * Protected route - requires authentication
   */
  router.get('/:id/comments', requireAuth, async (req, res, next) => {
    try {
      const newsId = parseInt(req.params.id);
      const news = await storage.getNewsById(newsId);
      
      if (!news) {
        return res.status(404).json({
          error: true,
          message: 'News not found'
        });
      }
      
      const comments = await storage.getCommentsByNewsId(newsId);
      res.json(comments);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Add a comment to a news item
   * Protected route - requires authentication
   */
  router.post('/:id/comments', requireAuth, async (req, res, next) => {
    try {
      const newsId = parseInt(req.params.id);
      const { text } = req.body;
      
      // Validate required fields
      if (!text) {
        return res.status(400).json({
          error: true,
          message: 'Comment text is required'
        });
      }
      
      const news = await storage.getNewsById(newsId);
      
      if (!news) {
        return res.status(404).json({
          error: true,
          message: 'News not found'
        });
      }
      
      const comment = await storage.createComment({
        newsId,
        authorId: req.user.id,
        author: req.user.username,
        text
      });
      
      res.status(201).json(comment);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = newsRoutes;
