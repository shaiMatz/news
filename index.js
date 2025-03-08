/**
 * Entry point for the application
 * This file starts both the server and client (for development)
 */

// Import required modules
const { spawn } = require('child_process');
const path = require('path');

// Define paths
const serverPath = path.join(__dirname, 'server', 'index.js');

// Print startup message
console.log('Starting NewsGeo application...');
console.log('========================================');

// Start the Express server
const server = spawn('node', [serverPath], { stdio: 'inherit' });

// Handle server process events
server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server process exited with code ${code}`);
    process.exit(code);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  
  // Kill the server process
  server.kill('SIGINT');
  
  // Exit this process
  process.exit(0);
});

console.log('Server is running on http://0.0.0.0:5000');
console.log('React Native client should be started separately using expo start');
console.log('========================================');
