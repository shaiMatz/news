const express = require('express');
const { trackNewsActivity, getTrendingNews, getActiveRegions } = require('../services/streaming');

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
   * Get all news or filter by location
   * Public route - accessible without authentication, but with limits for non-authenticated users
   */
  router.get('/', async (req, res, next) => {
    try {
      const { lat, lon, limit } = req.query;
      let newsItems = [];
      
      // If lat and lon provided, filter by location
      if (lat && lon) {
        newsItems = await storage.getNewsByLocation(
          parseFloat(lat),
          parseFloat(lon)
        );
      } else {
        // Otherwise, get all news
        newsItems = await storage.getAllNews();
      }
      
      // Check if user is authenticated
      const isAuthenticated = req.isAuthenticated();
      
      // Enhance news with user-specific data if authenticated
      if (isAuthenticated) {
        const userId = req.user.id;
        newsItems.forEach(news => {
          news.liked = news.likedBy.includes(userId);
        });
      } else {
        // For non-authenticated users, limit the number of news items
        // and add a flag indicating the freemium limitation
        newsItems = newsItems.slice(0, FREE_NEWS_LIMIT);
        
        // Add metadata for client to show "login for more" messaging
        res.set('X-Freemium-Model', 'true');
        res.set('X-Free-News-Limit', FREE_NEWS_LIMIT.toString());
      }
      
      // Apply custom limit from query parameter if provided
      const customLimit = limit ? parseInt(limit, 10) : null;
      if (customLimit && !isNaN(customLimit)) {
        const actualLimit = !isAuthenticated 
          ? Math.min(customLimit, FREE_NEWS_LIMIT) 
          : customLimit;
        newsItems = newsItems.slice(0, actualLimit);
      }
      
      // Return augmented response for freemium users
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
      console.error('Error fetching news:', err);
      next(err);
    }
  });

  /**
   * Get a specific news item by ID
   * Public route - but restricted by freemium model
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
      
      // Check if user is authenticated
      const isAuthenticated = req.isAuthenticated();
      
      // If not authenticated, check if the news is within the free limit
      if (!isAuthenticated) {
        // Get all news to check position
        const allNews = await storage.getAllNews();
        const newsIndex = allNews.findIndex(item => item.id === newsId);
        
        // If news is beyond the free limit, return 403 Forbidden
        if (newsIndex >= FREE_NEWS_LIMIT) {
          return res.status(403).json({
            error: true,
            message: 'Please sign in to access more news content',
            freemium: true,
            freeLimit: FREE_NEWS_LIMIT
          });
        }
      }
      
      // Track view (only if user is different from author)
      if (isAuthenticated && req.user.id !== news.authorId) {
        await storage.incrementNewsViews(newsId);
        
        // Also track for real-time trending
        const locationData = req.body.location || {};
        trackNewsActivity(newsId, 'view', {
          userId: req.user.id,
          location: {
            ...locationData,
            regionName: news.location
          }
        });
      }
      
      // Enhance news with user-specific data if authenticated
      if (isAuthenticated) {
        const userId = req.user.id;
        news.liked = news.likedBy.includes(userId);
      }
      
      // Return augmented response with freemium metadata
      const response = {
        ...news,
        meta: {
          freemium: !isAuthenticated,
          freeLimit: !isAuthenticated ? FREE_NEWS_LIMIT : null
        }
      };
      
      res.json(response);
    } catch (err) {
      console.error('Error fetching news by ID:', err);
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
      console.error('Error creating news:', err);
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
      
      // Get the news item to get location and check if it was a like or unlike
      const news = await storage.getNewsById(newsId);
      if (news && news.likedBy.includes(req.user.id)) {
        // Track for real-time trending (only track new likes, not unlikes)
        trackNewsActivity(newsId, 'like', {
          userId: req.user.id,
          location: {
            regionName: news.location
          }
        });
      }
      
      res.json(result);
    } catch (err) {
      console.error('Error liking news:', err);
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
      console.error('Error fetching comments:', err);
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
      
      // Track for real-time trending
      trackNewsActivity(newsId, 'comment', {
        userId: req.user.id,
        location: {
          regionName: news.location
        }
      });
      
      res.status(201).json(comment);
    } catch (err) {
      console.error('Error adding comment:', err);
      next(err);
    }
  });

  /**
   * Get trending news - most liked or viewed (traditional method)
   * Public route - but with freemium limitations
   */
  router.get('/trending/:type', async (req, res, next) => {
    try {
      const { type } = req.params;
      let newsItems = await storage.getAllNews();
      
      // Sort based on trending type
      if (type === 'likes') {
        newsItems.sort((a, b) => b.likes - a.likes);
      } else if (type === 'views') {
        newsItems.sort((a, b) => b.views - a.views);
      } else {
        return res.status(400).json({
          error: true,
          message: 'Invalid trending type. Use "likes" or "views"'
        });
      }
      
      // Check if user is authenticated
      const isAuthenticated = req.isAuthenticated();
      
      // For non-authenticated users, limit the results
      if (!isAuthenticated) {
        newsItems = newsItems.slice(0, FREE_NEWS_LIMIT);
      }
      
      // Enhance news with user-specific data if authenticated
      if (isAuthenticated) {
        const userId = req.user.id;
        newsItems.forEach(news => {
          news.liked = news.likedBy.includes(userId);
        });
      }
      
      // Return augmented response
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
      console.error('Error fetching trending news:', err);
      next(err);
    }
  });
  
  /**
   * Get real-time trending news (new method)
   * Public route - but with freemium limitations
   */
  router.get('/realtime-trending', async (req, res, next) => {
    try {
      const { timeframe = 'lastHour', region, limit = 10 } = req.query;
      
      // Get trending news based on real-time activity tracking
      const trendingNewsIds = getTrendingNews({
        timeframe,
        region,
        limit: parseInt(limit, 10) || 10
      });
      
      // Check if user is authenticated
      const isAuthenticated = req.isAuthenticated();
      
      // Fetch full news items from storage based on IDs
      const allNews = await storage.getAllNews();
      
      // Map trending news IDs to full news objects
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
        .filter(Boolean); // Remove null items
      
      // For non-authenticated users, limit the results
      if (!isAuthenticated) {
        newsItems = newsItems.slice(0, FREE_NEWS_LIMIT);
      }
      
      // Enhance news with user-specific data if authenticated
      if (isAuthenticated) {
        const userId = req.user.id;
        newsItems.forEach(news => {
          news.liked = news.likedBy.includes(userId);
        });
      }
      
      // Return augmented response
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
      console.error('Error fetching real-time trending news:', err);
      next(err);
    }
  });
  
  /**
   * Get active regions with news activity
   * Public route
   */
  router.get('/active-regions', async (req, res) => {
    try {
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
      console.error('Error fetching active regions:', err);
      res.status(500).json({ error: true, message: 'Failed to fetch active regions' });
    }
  });

  return router;
}

module.exports = newsRoutes;
