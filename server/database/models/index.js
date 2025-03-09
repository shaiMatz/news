const User = require('./User');
const News = require('./News');
const Comment = require('./Comment');
const Notification = require('./Notification');
const Follow = require('./Follow');
const NewsLike = require('./NewsLike');

// Define relationships
// Users and News
User.hasMany(News, { foreignKey: 'authorId', as: 'news' });
News.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// Users and Comments
User.hasMany(Comment, { foreignKey: 'authorId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'authorId', as: 'commentAuthor' });

// News and Comments
News.hasMany(Comment, { foreignKey: 'newsId', as: 'comments' });
Comment.belongsTo(News, { foreignKey: 'newsId', as: 'newsItem' });

// Users and Notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Followers and Following
User.belongsToMany(User, { 
  through: Follow, 
  as: 'followers',
  foreignKey: 'targetUserId',
  otherKey: 'followerId'
});

User.belongsToMany(User, { 
  through: Follow, 
  as: 'following',
  foreignKey: 'followerId',
  otherKey: 'targetUserId'
});

// News and Likes (Users who liked)
News.belongsToMany(User, { 
  through: NewsLike, 
  as: 'likedBy',
  foreignKey: 'newsId',
  otherKey: 'userId'
});

User.belongsToMany(News, { 
  through: NewsLike, 
  as: 'liked',
  foreignKey: 'userId',
  otherKey: 'newsId'
});

module.exports = {
  User,
  News,
  Comment,
  Notification,
  Follow,
  NewsLike
};