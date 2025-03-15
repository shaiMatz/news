const express = require('express');
const { trackNewsActivity, getTrendingNews, getActiveRegions } = require('../services/streaming');
const logger = require('../utils/logger').createLogger('news');

/**
 * News routes for the API
 *
 * @param {Object} storage - Storage interface
 * @returns {Router} Express router
 */
function newsRoutes(storage) {
  const router = express.Router();

  // Constants for freemium model
  const FREE_NEWS_LIMIT = 10;

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
   * Get all news or filter by location (public route)
   */
  router.get('/', async (req, res, next) => {
    try {
      logger.info('/news route called');
      const { lat, lon, limit } = req.query;
      let newsItems = [];

      // If lat and lon provided, filter by location
      if (lat && lon) {
        newsItems = await storage.getNewsByLocation(parseFloat(lat), parseFloat(lon));
      } else {
        // Otherwise, get all news
        newsItems = await storage.getAllNews();
      }

      // Check if user is authenticated
      const isAuthenticated = req.isAuthenticated();

      // Enhance or limit news for non-authenticated users
      if (isAuthenticated) {
        const userId = req.user.id;
        newsItems.forEach(news => {
          news.liked = news.likedBy.includes(userId);
        });
      } else {
        // Limit for non-authenticated
        newsItems = newsItems.slice(0, FREE_NEWS_LIMIT);
        // Add metadata
        res.set('X-Freemium-Model', 'true');
        res.set('X-Free-News-Limit', FREE_NEWS_LIMIT.toString());
      }

      // Apply custom limit from query
      const customLimit = limit ? parseInt(limit, 10) : null;
      if (customLimit && !isNaN(customLimit)) {
        const actualLimit = !isAuthenticated
          ? Math.min(customLimit, FREE_NEWS_LIMIT)
          : customLimit;
        newsItems = newsItems.slice(0, actualLimit);
      }

      // Return response
      const response = {
        news: newsItems,
        meta: {
          total: newsItems.length,
          freemium: !isAuthenticated,
          freeLimit: !isAuthenticated ? FREE_NEWS_LIMIT : null,
          hasMoreContent: !isAuthenticated && newsItems.length >= FREE_NEWS_LIMIT
        }
      };

      res.json(response);
    } catch (err) {
      logger.error('Error fetching news:', err);
      next(err);
    }
  });

  /**
   * Create a new news item (protected route)
   */
  router.post('/', requireAuth, async (req, res, next) => {
    try {
      logger.info('POST /news route called');
      const { title, description, videoUrl, thumbnail, location, coordinates } = req.body;

      if (!title || !description) {
        return res.status(400).json({
          error: true,
          message: 'Title and description are required'
        });
      }

      const newsData = {
        title,
        description,
        videoUrl: videoUrl || '',
        thumbnail: thumbnail || 'https://via.placeholder.com/300x200?text=NewsGeo',
        location: location || 'Unknown',
        coordinates: coordinates || null,
        isLive: req.body.isLive || false
      };

      const news = await storage.createNews(newsData, req.user.id);
      res.status(201).json(news);
    } catch (err) {
      logger.error('Error creating news:', err);
      next(err);
    }
  });

  /**
   * Like or unlike a news item (protected route)
   */
  router.post('/:id/like', requireAuth, async (req, res, next) => {
    try {
      logger.info('/like route called');
      const newsId = parseInt(req.params.id);
      if (!newsId || isNaN(newsId)) {
        return res.status(402).json({
          error: true,
          message: 'Invalid news ID'
        });
      }
      const result = await storage.likeNews(newsId, req.user.id);

      // If newly liked, track it for real-time trending
      const news = await storage.getNewsById(newsId);
      if (news && news.likedBy.includes(req.user.id)) {
        trackNewsActivity(newsId, 'like', {
          userId: req.user.id,
          location: { regionName: news.location }
        });
      }

      res.json(result);
    } catch (err) {
      logger.error('Error liking news:', err);
      next(err);
    }
  });

  /**
   * Get comments for a news item (protected route)
   */
  router.get('/:id/comments', requireAuth, async (req, res, next) => {
    try {
      logger.info('/comments route called');
      const newsId = parseInt(req.params.id);
      if (!newsId || isNaN(newsId)) {
        return res.status(402).json({
          error: true,
          message: 'Invalid news ID'
        });
      }

      const news = await storage.getNewsById(newsId);
      if (!news) {
        return res.status(402).json({
          error: true,
          message: 'News not found'
        });
      }

      const comments = await storage.getCommentsByNewsId(newsId);
      res.json(comments);
    } catch (err) {
      logger.error('Error fetching comments:', err);
      next(err);
    }
  });

  /**
   * Add a comment to a news item (protected route)
   */
  router.post('/:id/comments', requireAuth, async (req, res, next) => {
    try {
      logger.info('/comments route called');
      const newsId = parseInt(req.params.id);
      if (!newsId || isNaN(newsId)) {
        return res.status(402).json({
          error: true,
          message: 'Invalid news ID'
        });
      }

      const { text } = req.body;
      if (!text) {
        return res.status(400).json({
          error: true,
          message: 'Comment text is required'
        });
      }

      const news = await storage.getNewsById(newsId);
      if (!news) {
        return res.status(402).json({
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

      // Track for real-time trending
      trackNewsActivity(newsId, 'comment', {
        userId: req.user.id,
        location: { regionName: news.location }
      });

      res.status(201).json(comment);
    } catch (err) {
      logger.error('Error adding comment:', err);
      next(err);
    }
  });

  /**
   * Get trending news - most liked or viewed (public route)
   */
  router.get('/trending/:type', async (req, res, next) => {
    try {
      logger.info(`/trending/${req.params.type} route called, {type: ${req.params.type}}`);
      const { type } = req.params;
      let newsItems = await storage.getAllNews();

      // Sort based on trending type
      if (type === 'likes') {
        newsItems.sort((a, b) => b.likes - a.likes);
      } else if (type === 'views') {
        newsItems.sort((a, b) => b.views - a.views);
      } else {
        return res.status(402).json({
          error: true,
          message: 'Invalid trending type. Use "likes" or "views"'
        });
      }

      // Check if user is authenticated
      const isAuthenticated = req.isAuthenticated();

      // Limit results for non-authenticated users
      if (!isAuthenticated) {
        newsItems = newsItems.slice(0, FREE_NEWS_LIMIT);
      }

      // Enhance with liked status for authenticated users
      if (isAuthenticated) {
        const userId = req.user.id;
        newsItems.forEach(news => {
          news.liked = news.likedBy.includes(userId);
        });
      }

      const response = {
        news: newsItems,
        meta: {
          total: newsItems.length,
          type,
          freemium: !isAuthenticated,
          freeLimit: !isAuthenticated ? FREE_NEWS_LIMIT : null
        }
      };

      res.json(response);
    } catch (err) {
      logger.error('Error fetching trending news:', err);
      next(err);
    }
  });

  /**
   * Get real-time trending news (public route)
   * NOTE: put this BEFORE the /:id route to avoid conflicts
   */
  router.get('/realtime-trending', async (req, res, next) => {
    try {
      logger.info('/realtime-trending route called');
      const { timeframe = 'lastHour', region, limit = 10 } = req.query;

      // Get trending IDs from streaming service
      const trendingNewsIds = getTrendingNews({
        timeframe,
        region,
        limit: parseInt(limit, 10) || 10
      });

      // Check if user is authenticated
      const isAuthenticated = req.isAuthenticated();

      // Fetch all news
      const allNews = await storage.getAllNews();

      // Map trending IDs to news objects
      let newsItems = trendingNewsIds
        .map(trendItem => {
          const newsItem = allNews.find(n => n.id.toString() === trendItem.newsId);
          if (newsItem) {
            return {
              ...newsItem,
              trendScore: trendItem.score,
              trendingActivities: trendItem.activityCounts,
              regionActivity: trendItem.regionActivity
            };
          }
          return null;
        })
        .filter(Boolean);

      // Limit for non-authenticated users
      if (!isAuthenticated) {
        newsItems = newsItems.slice(0, FREE_NEWS_LIMIT);
      }

      // Enhance with liked status for authenticated users
      if (isAuthenticated) {
        const userId = req.user.id;
        newsItems.forEach(news => {
          news.liked = news.likedBy.includes(userId);
        });
      }

      const response = {
        news: newsItems,
        meta: {
          total: newsItems.length,
          timeframe,
          region: region || 'global',
          freemium: !isAuthenticated,
          freeLimit: !isAuthenticated ? FREE_NEWS_LIMIT : null
        }
      };

      res.json(response);
    } catch (err) {
      logger.error('Error fetching real-time trending news:', err);
      next(err);
    }
  });

  /**
   * Get active regions with news activity (public route)
   */
  router.get('/active-regions', async (req, res) => {
    try {
      logger.info('/active-regions route called');
      const { limit = 10, activeWithinMinutes = 60 } = req.query;

      const activeRegions = getActiveRegions({
        limit: parseInt(limit, 10) || 10,
        activeWithinMinutes: parseInt(activeWithinMinutes, 10) || 60
      });

      res.json({
        regions: activeRegions,
        meta: {
          total: activeRegions.length,
          activeWithinMinutes: parseInt(activeWithinMinutes, 10) || 60
        }
      });
    } catch (err) {
      logger.error('Error fetching active regions:', err);
      res.status(500).json({ error: true, message: 'Failed to fetch active regions' });
    }
  });

  /**
   * Get a specific news item by ID (public route, but freemium-limited)
   */
  router.get('/:id', async (req, res, next) => {
    try {
      logger.info('/news/:id route called');
      const newsId = parseInt(req.params.id);

      if (!newsId || isNaN(newsId)) {
        return res.status(402).json({
          error: true,
          message: 'Invalid news ID'
        });
      }

      const news = await storage.getNewsById(newsId);
      if (!news) {
        logger.warn('News not found', { id: req.params.id });
        return res.status(402).json({
          error: true,
          message: 'News not found'
        });
      }

      // Check auth/freemium limits
      const isAuthenticated = req.isAuthenticated();
      if (!isAuthenticated) {
        const allNews = await storage.getAllNews();
        const newsIndex = allNews.findIndex(item => item.id === newsId);
        if (newsIndex >= FREE_NEWS_LIMIT) {
          return res.status(403).json({
            error: true,
            message: 'Please sign in to access more news content',
            freemium: true,
            freeLimit: FREE_NEWS_LIMIT
          });
        }
      }

      // Track view for authenticated, non-author users
      if (isAuthenticated && req.user.id !== news.authorId) {
        await storage.incrementNewsViews(newsId);
        const locationData = req.body.location || {};
        trackNewsActivity(newsId, 'view', {
          userId: req.user.id,
          location: {
            ...locationData,
            regionName: news.location
          }
        });
      }

      // Mark as liked if user is authenticated
      if (isAuthenticated) {
        const userId = req.user.id;
        news.liked = news.likedBy.includes(userId);
      }

      const response = {
        ...news,
        meta: {
          freemium: !isAuthenticated,
          freeLimit: !isAuthenticated ? FREE_NEWS_LIMIT : null
        }
      };

      res.json(response);
    } catch (err) {
      logger.error('Error fetching news by ID:', err);
      next(err);
    }
  });

  return router;
}

module.exports = newsRoutes;
