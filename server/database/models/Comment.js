const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  newsId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Comment;