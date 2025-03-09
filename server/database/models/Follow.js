const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const Follow = sequelize.define('Follow', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  followerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  targetUserId: {
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
      fields: ['followerId', 'targetUserId']
    }
  ]
});

module.exports = Follow;