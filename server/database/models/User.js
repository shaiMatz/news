const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      locationTracking: true,
      notifications: true,
      contentLanguage: 'English'
    }
  },
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {
      uploads: 0,
      likes: 0,
      views: 0,
      followers: 0,
      following: 0
    }
  }
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = User;