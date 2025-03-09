const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const { Op } = require('sequelize');
const models = require('./database/models');
const { sequelize, testConnection } = require('./database/config');
const bcrypt = require('bcrypt');

/**
 * DatabaseStorage implementation
 * Provides a PostgreSQL database storage solution for the application
 */
class DatabaseStorage {
  constructor() {
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // Database initialization
  async initialize() {
    try {
      // Test database connection
      const connected = await testConnection();
      if (!connected) {
        console.error('Database connection failed, cannot initialize storage');
        return false;
      }

      // Sync all models with the database
      await sequelize.sync();
      console.log('Database models synchronized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing database storage:', error);
      return false;
    }
  }

  // User-related methods
  async createUser(userData) {
    const user = await models.User.create({
      username: userData.username,
      email: userData.email,
      password: userData.password
    });
    
    // Return user data without password
    const userJson = user.toJSON();
    delete userJson.password;
    return userJson;
  }

  async getUserById(id) {
    const user = await models.User.findByPk(id);
    return user ? user.toJSON() : null;
  }

  async getUserByUsername(username) {
    const user = await models.User.findOne({
      where: { username }
    });
    return user ? user.toJSON() : null;
  }

  async getUserByEmail(email) {
    const user = await models.User.findOne({
      where: { email }
    });
    return user ? user.toJSON() : null;
  }

  async updateUserProfile(userId, profileData) {
    const user = await models.User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update only allowed fields
    await user.update(profileData);
    
    // Return user data without password
    const userJson = user.toJSON();
    delete userJson.password;
    return userJson;
  }

  async updateUserSettings(userId, settings) {
    const user = await models.User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Merge existing settings with new settings
    const updatedSettings = {
      ...user.settings,
      ...settings
    };
    
    await user.update({ settings: updatedSettings });
    return updatedSettings;
  }

  // News-related methods
  async createNews(newsData, authorId) {
    // Create short description if not provided
    if (!newsData.shortDescription && newsData.description) {
      newsData.shortDescription = newsData.description.substring(0, 150) + 
        (newsData.description.length > 150 ? '...' : '');
    }
    
    const news = await models.News.create({
      title: newsData.title,
      description: newsData.description,
      shortDescription: newsData.shortDescription,
      videoUrl: newsData.videoUrl,
      thumbnail: newsData.thumbnail,
      location: newsData.location,
      coordinates: newsData.coordinates,
      authorId,
      isLive: newsData.isLive || false
    });
    
    // Update user stats
    const user = await models.User.findByPk(authorId);
    if (user) {
      const stats = user.stats || {};
      stats.uploads = (stats.uploads || 0) + 1;
      await user.update({ stats });
    }
    
    return news.toJSON();
  }

  async getAllNews(limit = null) {
    const options = {
      order: [['publishedAt', 'DESC']]
    };
    
    if (limit) {
      options.limit = limit;
    }
    
    const news = await models.News.findAll(options);
    return news.map(item => item.toJSON());
  }

  async getNewsByLocation(latitude, longitude, radiusKm = 50) {
    // This is a simplified query that assumes the coordinates are stored as JSON
    // For production, you would use a spatial database query
    const news = await models.News.findAll({
      where: {
        coordinates: {
          [Op.not]: null
        }
      },
      order: [['publishedAt', 'DESC']]
    });
    
    // Filter by distance
    return news.filter(item => {
      const newsJson = item.toJSON();
      if (!newsJson.coordinates || !latitude || !longitude) {
        return false;
      }
      
      // Calculate distance between coordinates (simplified)
      const distance = Math.sqrt(
        Math.pow(newsJson.coordinates.latitude - latitude, 2) + 
        Math.pow(newsJson.coordinates.longitude - longitude, 2)
      ) * 111; // Rough conversion to km
      
      return distance <= radiusKm;
    }).map(item => item.toJSON());
  }

  async getNewsById(id) {
    const news = await models.News.findByPk(id, {
      include: [
        {
          model: models.User,
          as: 'author',
          attributes: ['id', 'username']
        }
      ]
    });
    return news ? news.toJSON() : null;
  }

  async getUserNews(userId) {
    const news = await models.News.findAll({
      where: { authorId: userId },
      order: [['publishedAt', 'DESC']]
    });
    return news.map(item => item.toJSON());
  }

  async getUserLikedNews(userId) {
    const user = await models.User.findByPk(userId, {
      include: [
        {
          model: models.News,
          as: 'liked',
          through: { attributes: [] } // Don't include join table
        }
      ]
    });
    
    return user ? user.liked.map(item => item.toJSON()) : [];
  }

  async likeNews(newsId, userId) {
    const [news, user] = await Promise.all([
      models.News.findByPk(newsId),
      models.User.findByPk(userId)
    ]);
    
    if (!news || !user) {
      throw new Error('News or User not found');
    }
    
    // Check if already liked
    const like = await models.NewsLike.findOne({
      where: { newsId, userId }
    });
    
    if (like) {
      // Unlike - remove the like
      await like.destroy();
      
      // Decrement likes count
      news.likes = Math.max(0, news.likes - 1);
      await news.save();
      
      // Update user stats
      if (user.stats && user.stats.likes > 0) {
        user.stats.likes--;
        await user.save();
      }
      
      return {
        id: newsId,
        likes: news.likes,
        liked: false
      };
    } else {
      // Like - create a new like
      await models.NewsLike.create({ newsId, userId });
      
      // Increment likes count
      news.likes = (news.likes || 0) + 1;
      await news.save();
      
      // Update user stats
      const stats = user.stats || {};
      stats.likes = (stats.likes || 0) + 1;
      await user.update({ stats });
      
      // Create a notification for the news author
      if (news.authorId !== userId) {
        const likerUsername = user.username;
        await this.createNotification({
          userId: news.authorId,
          type: 'like',
          title: 'Someone liked your news',
          message: `${likerUsername} liked your news "${news.title}"`,
          referenceId: newsId,
          referenceType: 'news'
        });
      }
      
      return {
        id: newsId,
        likes: news.likes,
        liked: true
      };
    }
  }

  async incrementNewsViews(newsId) {
    const news = await models.News.findByPk(newsId);
    
    if (!news) {
      throw new Error('News not found');
    }
    
    // Increment views count
    news.views = (news.views || 0) + 1;
    await news.save();
    
    // Update author stats
    const author = await models.User.findByPk(news.authorId);
    if (author) {
      const stats = author.stats || {};
      stats.views = (stats.views || 0) + 1;
      await author.update({ stats });
    }
    
    return {
      id: newsId,
      views: news.views
    };
  }

  // Comment-related methods
  async createComment(commentData) {
    const comment = await models.Comment.create({
      newsId: commentData.newsId,
      authorId: commentData.authorId,
      author: commentData.author,
      text: commentData.text
    });
    
    // Create a notification for the news author
    const news = await models.News.findByPk(commentData.newsId);
    if (news && news.authorId !== commentData.authorId) {
      const commenter = await models.User.findByPk(commentData.authorId);
      const commenterName = commenter ? commenter.username : 'Someone';
      
      await this.createNotification({
        userId: news.authorId,
        type: 'comment',
        title: 'New comment on your news',
        message: `${commenterName} commented on your news "${news.title}"`,
        referenceId: commentData.newsId,
        referenceType: 'news'
      });
    }
    
    return comment.toJSON();
  }

  async getCommentsByNewsId(newsId) {
    const comments = await models.Comment.findAll({
      where: { newsId },
      order: [['createdAt', 'DESC']]
    });
    return comments.map(comment => comment.toJSON());
  }

  // Notification-related methods
  async createNotification(notificationData) {
    const notification = await models.Notification.create({
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      referenceId: notificationData.referenceId,
      referenceType: notificationData.referenceType,
      read: false
    });
    
    return notification.toJSON();
  }

  async getUserNotifications(userId) {
    const notifications = await models.Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    return notifications.map(notification => notification.toJSON());
  }

  async markNotificationAsRead(id) {
    const notification = await models.Notification.findByPk(id);
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    notification.read = true;
    await notification.save();
    
    return notification.toJSON();
  }

  async markAllNotificationsAsRead(userId) {
    await models.Notification.update(
      { read: true },
      { where: { userId, read: false } }
    );
    
    return true;
  }
  
  // Following-related methods
  async followUser(followerId, targetUserId) {
    // Prevent users from following themselves
    if (followerId === targetUserId) {
      throw new Error('Cannot follow yourself');
    }
    
    // Check if both users exist
    const [followerUser, targetUser] = await Promise.all([
      models.User.findByPk(followerId),
      models.User.findByPk(targetUserId)
    ]);
    
    if (!followerUser || !targetUser) {
      throw new Error('User not found');
    }
    
    // Check if already following
    const existingFollow = await models.Follow.findOne({
      where: { followerId, targetUserId }
    });
    
    if (existingFollow) {
      // Already following, return the existing relationship
      return {
        followerId,
        targetUserId,
        alreadyFollowing: true
      };
    }
    
    // Create new follow relationship
    await models.Follow.create({
      followerId,
      targetUserId
    });
    
    // Update stats for both users
    // Update follower stats
    const followerStats = followerUser.stats || {};
    followerStats.following = (followerStats.following || 0) + 1;
    await followerUser.update({ stats: followerStats });
    
    // Update target user stats
    const targetStats = targetUser.stats || {};
    targetStats.followers = (targetStats.followers || 0) + 1;
    await targetUser.update({ stats: targetStats });
    
    // Create notification for the target user
    await this.createNotification({
      userId: targetUserId,
      type: 'follow',
      title: 'New Follower',
      message: `${followerUser.username} is now following you`,
      referenceId: followerId,
      referenceType: 'user'
    });
    
    return {
      followerId,
      targetUserId,
      alreadyFollowing: false
    };
  }
  
  async unfollowUser(followerId, targetUserId) {
    // Find the follow relationship
    const follow = await models.Follow.findOne({
      where: { followerId, targetUserId }
    });
    
    if (!follow) {
      // Not following, return early
      return {
        followerId,
        targetUserId,
        wasFollowing: false
      };
    }
    
    // Remove the follow relationship
    await follow.destroy();
    
    // Update stats for both users
    // Update follower stats
    const follower = await models.User.findByPk(followerId);
    if (follower && follower.stats && follower.stats.following > 0) {
      follower.stats.following--;
      await follower.save();
    }
    
    // Update target user stats
    const target = await models.User.findByPk(targetUserId);
    if (target && target.stats && target.stats.followers > 0) {
      target.stats.followers--;
      await target.save();
    }
    
    return {
      followerId,
      targetUserId,
      wasFollowing: true
    };
  }
  
  async getFollowers(userId) {
    const user = await models.User.findByPk(userId, {
      include: [
        {
          model: models.User,
          as: 'followers',
          attributes: ['id', 'username', 'email', 'settings', 'stats', 'createdAt'],
          through: { attributes: ['createdAt'] }
        }
      ]
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Format the followers list with followingSince information
    return user.followers.map(follower => {
      const followerJson = follower.toJSON();
      return {
        ...followerJson,
        followingSince: follower.Follow.createdAt
      };
    });
  }
  
  async getFollowing(userId) {
    const user = await models.User.findByPk(userId, {
      include: [
        {
          model: models.User,
          as: 'following',
          attributes: ['id', 'username', 'email', 'settings', 'stats', 'createdAt'],
          through: { attributes: ['createdAt'] }
        }
      ]
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Format the following list with followingSince information
    return user.following.map(followed => {
      const followedJson = followed.toJSON();
      return {
        ...followedJson,
        followingSince: followed.Follow.createdAt
      };
    });
  }
  
  async isFollowing(followerId, targetUserId) {
    const follow = await models.Follow.findOne({
      where: { followerId, targetUserId }
    });
    
    return !!follow;
  }
  
  async getFollowingFeed(userId, limit = 20) {
    // Get IDs of users being followed
    const follows = await models.Follow.findAll({
      where: { followerId: userId },
      attributes: ['targetUserId']
    });
    
    if (follows.length === 0) {
      return [];
    }
    
    const followingIds = follows.map(follow => follow.targetUserId);
    
    // Get news from followed users
    const news = await models.News.findAll({
      where: {
        authorId: {
          [Op.in]: followingIds
        }
      },
      order: [['publishedAt', 'DESC']],
      limit
    });
    
    return news.map(item => item.toJSON());
  }
}

/**
 * Setup storage for the application
 * 
 * @returns {DatabaseStorage} Storage instance
 */
async function setupStorage() {
  const storage = new DatabaseStorage();
  await storage.initialize();
  return storage;
}

module.exports = { setupStorage };