/**
 * Execute the database seeding script
 * This is a standalone script to add demo data to the database
 */

console.log('Starting database seed process...');
console.log('=================================');

// Import and run the seed function
const seedDatabase = require('./server/seed-db');

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('=================================');
    console.log('Database seeding completed successfully!');
    console.log('You can now restart the server to use the demo data.');
  })
  .catch(error => {
    console.error('=================================');
    console.error('Error during database seeding:', error);
    process.exit(1);
  });