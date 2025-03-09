const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const News = sequelize.define('News', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  shortDescription: {
    type: DataTypes.STRING,
    allowNull: true
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  thumbnail: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'https://via.placeholder.com/300x200'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  coordinates: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isLive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  createdAt: 'publishedAt',
  updatedAt: 'updatedAt'
});

module.exports = News;