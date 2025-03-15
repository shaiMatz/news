require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger').createLogger('database-config');

// Use database URL from environment, or create a default connection for development
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/newsgeo';

// Log the connection status
logger.info('Initializing database connection');

// Sequelize instance with SSL explicitly turned off
const sequelize = new Sequelize(databaseUrl, {
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
