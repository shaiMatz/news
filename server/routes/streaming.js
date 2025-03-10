const express = require('express');
const streamingService = require('../services/streaming');

/**
 * Streaming routes for the API
 * Handles stream creation, management, and retrieval
 * 
 * @param {Object} storage - Storage interface
 * @returns {Router} Express router
 */
function streamingRoutes(storage) {
  const router = express.Router();
  
  /**
   * Middleware to check if user is authenticated
   */
  const authenticate = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: true,
        message: 'Authentication required'
      });
    }
    next();
  };
  
  /**
   * Get all active streams or filter by location
   * Public route - accessible without authentication
   */
  router.get('/', async (req, res) => {
    try {
      const { latitude, longitude, radius } = req.query;
      
      // If location parameters are provided, filter by location
      const locationFilter = (latitude && longitude) ? {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radiusKm: radius ? parseFloat(radius) : 50
      } : null;
      
      const streams = streamingService.getActiveStreams(locationFilter);
      res.json(streams);
    } catch (error) {
      console.error('Error getting streams:', error);
      res.status(500).json({
        error: true,
        message: 'Failed to retrieve streams'
      });
    }
  });
  
  /**
   * Get a specific stream by ID
   * Public route - accessible without authentication
   */
  router.get('/:streamId', async (req, res) => {
    try {
      const { streamId } = req.params;
      const stream = streamingService.getStream(streamId);
      
      if (!stream) {
        return res.status(404).json({
          error: true,
          message: 'Stream not found'
        });
      }
      
      res.json(stream);
    } catch (error) {
      console.error('Error getting stream:', error);
      res.status(500).json({
        error: true,
        message: 'Failed to retrieve stream'
      });
    }
  });
  
  /**
   * Create a new stream
   * Protected route - requires authentication
   */
  router.post('/', authenticate, async (req, res) => {
    try {
      const { newsId, title, metadata, isAnonymous } = req.body;
      
      if (!newsId || !title) {
        return res.status(400).json({
          error: true,
          message: 'Missing required fields: newsId and title'
        });
      }
      
      // Get the news item to verify it exists and current user is authorized
      const newsItem = await storage.getNewsById(parseInt(newsId));
      
      if (!newsItem) {
        return res.status(404).json({
          error: true,
          message: 'News item not found'
        });
      }
      
      // Check if user is the creator of the news or has special privileges
      if (newsItem.authorId !== req.user.id) {
        return res.status(403).json({
          error: true,
          message: 'Not authorized to create stream for this news item'
        });
      }
      
      // Include anonymous flag in stream metadata
      const updatedMetadata = {
        ...metadata,
        isAnonymous: !!isAnonymous
      };
      
      // Still use actual userId for server-side authentication and moderation
      // The isAnonymous flag will determine how the user is presented to viewers
      const stream = streamingService.createStream({
        newsId: parseInt(newsId),
        userId: req.user.id,
        title,
        metadata: updatedMetadata,
        isAnonymous: !!isAnonymous
      });
      
      res.status(201).json(stream);
    } catch (error) {
      console.error('Error creating stream:', error);
      res.status(500).json({
        error: true,
        message: 'Failed to create stream'
      });
    }
  });
  
  /**
   * End a stream
   * Protected route - requires authentication
   */
  router.post('/:streamId/end', authenticate, async (req, res) => {
    try {
      const { streamId } = req.params;
      const success = streamingService.endStream(streamId, req.user.id);
      
      if (!success) {
        return res.status(404).json({
          error: true,
          message: 'Stream not found or you are not authorized to end it'
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error ending stream:', error);
      res.status(500).json({
        error: true,
        message: 'Failed to end stream'
      });
    }
  });
  
  return router;
}

module.exports = streamingRoutes;