require('dotenv').config();
const { Sequelize } = require('sequelize');

// Create Sequelize instance using DATABASE_URL environment variable
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: false,
      rejectUnauthorized: false
    }
  },
  logging: process.env.NODE_ENV !== 'production' ? console.log : false
});

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
}

module.exports = {
  sequelize,
  testConnection
};