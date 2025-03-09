/**
 * Entry point for starting the server
 * This file is separated from the React Native bundler
 */

// Print startup message
console.log('Starting NewsGeo server...');
console.log('========================================');

// Start the Express server (directly requiring the server file)
require('./server/index.js');

console.log('Server initialization complete');
console.log('========================================');