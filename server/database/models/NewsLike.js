const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const NewsLike = sequelize.define('NewsLike', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  newsId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      unique: true,
      fields: ['newsId', 'userId']
    }
  ]
});

module.exports = NewsLike;