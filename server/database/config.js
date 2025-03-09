require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger').createLogger('database-config');

// Sequelize instance with SSL explicitly turned off
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: false, // Completely disable SSL for local PostgreSQL
  },
  logging: process.env.NODE_ENV !== 'production' ? 
    (msg) => logger.debug('Sequelize query', { query: msg.substring(0, 200) + (msg.length > 200 ? '...' : '') }) : 
    false,
});

// Test the database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    logger.error('❌ Unable to connect to the database', { 
      error: error.message,
      code: error.code || 'UNKNOWN',
      stack: error.stack
    });
    return false;
  }
}

module.exports = { sequelize, testConnection };
