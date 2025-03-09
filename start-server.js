/**
 * Entry point for starting the server
 * This file is separated from the React Native bundler
 */

// Import logger
const logger = require('./server/utils/logger').createLogger('startup');

// Print startup message
logger.info('Starting NewsGeo server...');
logger.info('========================================');

// Start the Express server (directly requiring the server file)
require('./server/index.js');

logger.info('Server initialization complete');
logger.info('========================================');