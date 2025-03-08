const express = require('express');

/**
 * Notification routes for the API
 * 
 * @param {Object} storage - Storage interface
 * @returns {Router} Express router
 */
function notificationsRoutes(storage) {
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
        return res.status(404).json({
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
      
      res.status(201).json(notification);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = notificationsRoutes;
