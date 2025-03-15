const express = require('express');

/**
 * Notification routes for the API
 * 
 * @param {Object} storage - Storage interface
 * @param {Object} utils - Utility functions
 * @param {Function} utils.sendNotificationToUser - Function to send real-time notifications
 * @returns {Router} Express router
 */
function notificationsRoutes(storage, utils = {}) {
  const router = express.Router();
  const { sendNotificationToUser } = utils;

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
   * Get notifications for the current user
   * Protected route - requires authentication
   */
  router.get('/', requireAuth, async (req, res, next) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Mark a notification as read
   * Protected route - requires authentication
   */
  router.post('/:id/read', requireAuth, async (req, res, next) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      // Get the notification
      const notifications = await storage.getUserNotifications(req.user.id);
      const notification = notifications.find(n => n.id === notificationId);
      
      if (!notification) {
        return res.status(402).json({
          error: true,
          message: 'Notification not found or does not belong to the current user'
        });
      }
      
      // Mark as read
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Mark all notifications as read
   * Protected route - requires authentication
   */
  router.post('/read-all', requireAuth, async (req, res, next) => {
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  /**
   * Create a test notification (for development purposes)
   * Protected route - requires authentication
   */
  router.post('/test', requireAuth, async (req, res, next) => {
    try {
      const { type = 'news', title, message } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({
          error: true,
          message: 'Title and message are required'
        });
      }
      
      const notification = await storage.createNotification({
        userId: req.user.id,
        type,
        title,
        message,
        referenceId: 0,
        referenceType: type
      });
      
      // Try to send real-time notification via WebSocket if function exists
      if (typeof sendNotificationToUser === 'function') {
        try {
          sendNotificationToUser(req.user.id, {
            title,
            message,
            type,
            id: notification.id,
            createdAt: notification.createdAt || new Date().toISOString(),
            referenceId: notification.referenceId,
            referenceType: notification.referenceType
          });
        } catch (wsError) {
          console.error('Error sending notification via WebSocket:', wsError);
          // Continue anyway since the notification is stored in the database
        }
      }
      
      res.status(201).json(notification);
    } catch (err) {
      next(err);
    }
  });
  
  /**
   * Create a notification for a user - admin or system only
   * This route is intended for server-to-server use
   * It can be secured further with an API key if needed
   */
  router.post('/create', async (req, res, next) => {
    try {
      const { userId, type = 'system', title, message, referenceId = 0, referenceType = type } = req.body;
      
      if (!userId || !title || !message) {
        return res.status(400).json({
          error: true,
          message: 'UserId, title, and message are required'
        });
      }
      
      const notification = await storage.createNotification({
        userId,
        type,
        title,
        message,
        referenceId,
        referenceType
      });
      
      // Try to send real-time notification via WebSocket if function exists
      if (typeof sendNotificationToUser === 'function') {
        try {
          sendNotificationToUser(userId, {
            title,
            message,
            type,
            id: notification.id,
            createdAt: notification.createdAt || new Date().toISOString(),
            referenceId,
            referenceType
          });
        } catch (wsError) {
          console.error('Error sending notification via WebSocket:', wsError);
          // Continue anyway since the notification is stored in the database
        }
      }
      
      res.status(201).json(notification);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = notificationsRoutes;
