/**
 * Schema definitions for the application
 * These types are shared between client and server
 */

/**
 * User schema
 * 
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} email - Email address
 * @property {string} [password] - Password (only stored on server)
 * @property {Date} createdAt - Account creation date
 * @property {Object} settings - User settings
 * @property {boolean} settings.locationTracking - Whether location tracking is enabled
 * @property {boolean} settings.notifications - Whether notifications are enabled
 * @property {string} settings.contentLanguage - Preferred content language
 * @property {Object} stats - User statistics
 * @property {number} stats.uploads - Number of news uploads
 * @property {number} stats.likes - Number of news likes
 * @property {number} stats.views - Number of news views
 */

/**
 * News schema
 * 
 * @typedef {Object} News
 * @property {number} id - News ID
 * @property {string} title - News title
 * @property {string} description - Full news description
 * @property {string} shortDescription - Short description for previews
 * @property {string} videoUrl - URL of the news video
 * @property {string} thumbnail - URL of the news thumbnail image
 * @property {string} location - Location name
 * @property {Object} coordinates - Geographic coordinates
 * @property {number} coordinates.latitude - Latitude
 * @property {number} coordinates.longitude - Longitude
 * @property {string} author - Author username
 * @property {number} authorId - Author user ID
 * @property {Date} publishedAt - Publication date
 * @property {boolean} isLive - Whether the news is live streaming
 * @property {number} likes - Number of likes
 * @property {number} views - Number of views
 * @property {Array<number>} likedBy - Array of user IDs who liked this news
 * @property {boolean} [liked] - Whether the current user has liked this news
 */

/**
 * Comment schema
 * 
 * @typedef {Object} Comment
 * @property {number} id - Comment ID
 * @property {number} newsId - ID of the associated news
 * @property {number} authorId - Author user ID
 * @property {string} author - Author username
 * @property {string} text - Comment text
 * @property {Date} createdAt - Creation date
 */

/**
 * Notification schema
 * 
 * @typedef {Object} Notification
 * @property {number} id - Notification ID
 * @property {number} userId - User ID this notification is for
 * @property {string} type - Notification type (news, like, comment, profile)
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {number} referenceId - ID of the referenced item (e.g., news ID)
 * @property {string} referenceType - Type of the referenced item (e.g., 'news')
 * @property {boolean} read - Whether the notification has been read
 * @property {Date} createdAt - Creation date
 */

// User related schemas for login and registration

/**
 * Auth credentials for login
 * 
 * @typedef {Object} LoginCredentials
 * @property {string} username - Username
 * @property {string} password - Password
 */

/**
 * Registration data for new users
 * 
 * @typedef {Object} RegisterData
 * @property {string} username - Username
 * @property {string} email - Email address
 * @property {string} password - Password
 */

/**
 * InsertUser schema - data needed to create a new user
 * @typedef {Object} InsertUser
 * @property {string} username - Unique username for the user
 * @property {string} email - User's email address
 * @property {string} password - User's password (will be hashed)
 */

/**
 * User schema for selecting user data
 * @typedef {Object} SelectUser
 * @property {number} id - Unique user identifier
 * @property {string} username - User's username
 * @property {string} email - User's email address
 * @property {string} [password] - Hashed password (only included in server-side operations)
 * @property {Date} createdAt - When the user account was created
 * @property {Object} settings - User's application settings
 * @property {Object} stats - User's activity statistics
 */

// Export the schemas for use in both client and server
const User = {};
const InsertUser = {};
const SelectUser = {};

module.exports = {
  User,
  InsertUser,
  SelectUser
};
