require('dotenv').config();
const { Sequelize } = require('sequelize');

// Sequelize instance with SSL explicitly turned off
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: false, // Completely disable SSL for local PostgreSQL
  },
  logging: process.env.NODE_ENV !== 'production' ? console.log : false,
});

// Test the database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
}

module.exports = { sequelize, testConnection };
