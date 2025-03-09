const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { WebSocketServer, WebSocket } = require('ws');
const { setupAuth } = require('./auth');
const { setupStorage } = require('./database-storage');
const newsRoutes = require('./routes/news');
const userRoutes = require('./routes/user');
const notificationsRoutes = require('./routes/notifications');
const streamingRoutes = require('./routes/streaming');
const logger = require('./utils/logger').createLogger('server');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;
const httpServer = createServer(app);
require('dotenv').config();

// Set up middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.static('.'));

// Set up WebSocket Server for raw WebSocket connections early
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// Define a map to track active streams by ID
const activeStreams = new Map();

// Define utility functions first so they can be used in routes
// Function to send real-time notifications via WebSocket
const sendNotificationToUser = (userId, notification) => {
  logger.debug('Attempting to send notification to user', { userId, notificationType: notification.type });
  
  if (!userId || !notification) {
    logger.warn('Invalid notification parameters', { userId, notification });
    return false;
  }

  let sent = false;
  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.clientInfo &&
      client.clientInfo.type === 'notifications' &&
      client.clientInfo.userId === userId.toString()
    ) {
      client.send(JSON.stringify({
        type: 'notification',
        ...notification,
        time: Date.now()
      }));
      sent = true;
      logger.debug('Notification sent successfully', { userId, notificationType: notification.type });
    }
  });

  if (!sent) {
    logger.info('No active connection found for notification delivery', { userId });
  }
  
  return sent;
};

// Set up session and database async, then start server
(async () => {
  try {
    // Set up session storage
    const storage = await setupStorage();
    
    // Set up session middleware
    app.use(session({
      secret: process.env.SESSION_SECRET || 'news-geo-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      },
      store: storage.sessionStore
    }));
    
    // Set up authentication
    setupAuth(app, storage);
    
    // Set up API routes with access to utility functions
    logger.info('Setting up API routes');
    app.use('/api/news', newsRoutes(storage));
    app.use('/api/profile', userRoutes(storage));
    app.use('/api/notifications', notificationsRoutes(storage, { sendNotificationToUser }));
    app.use('/api/streams', streamingRoutes(storage));
    
    logger.info('Database storage initialized successfully');
    
    // Start the server immediately after database initialization
    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server is running on http://0.0.0.0:${PORT}`);
      logger.info(`WebSocket server is running on ws://0.0.0.0:${PORT}/ws`);
      logger.info(`Socket.IO server is running on http://0.0.0.0:${PORT}`);
      logger.info('========================================');
      logger.info('React Native client should be started separately using expo start');
      logger.info('========================================');
    });
    
  } catch (error) {
    logger.error('Failed to initialize database storage', error);
    process.exit(1);
  }
})();

// Serve static files
app.use(express.static(process.cwd()));

// Serve the main page at the root
app.get('/', (req, res) => {
  logger.debug('GET request to root endpoint', { ip: req.ip });
  res.sendFile('index.html', { root: process.cwd() });
});

// Add a more specific route to serve index.html
app.get('/index.html', (req, res) => {
  logger.debug('GET request to index.html endpoint', { ip: req.ip });
  res.sendFile('index.html', { root: process.cwd() });
});

// Serve the test page
app.get('/test', (req, res) => {
  logger.debug('GET request to test endpoint', { ip: req.ip });
  res.sendFile('test.html', { root: process.cwd() });
});

// Serve the WebSocket test page
app.get('/websocket-test', (req, res) => {
  logger.debug('GET request to WebSocket test endpoint', { ip: req.ip });
  res.sendFile('websocket-test.html', { root: process.cwd() });
});

// Add a test API endpoint
app.get('/api/test', (req, res) => {
  logger.debug('Test API endpoint accessed', { ip: req.ip });
  res.json({ status: 'ok', message: 'API is working!', time: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error', { error: err, url: req.url, method: req.method, ip: req.ip });
  res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// Set up Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: true, // Allow all origins in development
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('New client connected via Socket.IO', { socketId: socket.id, ip: socket.handshake.address });

  // Handle client joining a specific news stream
  socket.on('join-stream', (newsId) => {
    logger.info('Client joined stream', { socketId: socket.id, newsId });
    socket.join(`news:${newsId}`);

    // Notify others in the room that someone joined
    socket.to(`news:${newsId}`).emit('viewer-joined', {
      viewerId: socket.id,
      timestamp: new Date()
    });

    // Update viewer count and broadcast to all in room
    const streamInfo = activeStreams.get(newsId) || { viewers: 0 };
    streamInfo.viewers++;
    activeStreams.set(newsId, streamInfo);
    
    logger.debug('Updated viewer count', { newsId, viewers: streamInfo.viewers });

    io.to(`news:${newsId}`).emit('viewer-count', {
      newsId,
      count: streamInfo.viewers
    });
  });

  // Handle client leaving a stream
  socket.on('leave-stream', (newsId) => {
    logger.info('Client left stream', { socketId: socket.id, newsId });
    socket.leave(`news:${newsId}`);

    // Update viewer count
    const streamInfo = activeStreams.get(newsId);
    if (streamInfo && streamInfo.viewers > 0) {
      streamInfo.viewers--;
      activeStreams.set(newsId, streamInfo);
      
      logger.debug('Updated viewer count on leave', { newsId, viewers: streamInfo.viewers });

      io.to(`news:${newsId}`).emit('viewer-count', {
        newsId,
        count: streamInfo.viewers
      });
    }
  });

  // Handle comments on a news stream
  socket.on('comment', ({ newsId, text, username }) => {
    const comment = {
      id: Date.now(),
      text,
      username,
      timestamp: new Date()
    };
    
    logger.debug('New comment received', { newsId, username, commentId: comment.id });
    
    // Broadcast comment to all viewers of this news
    io.to(`news:${newsId}`).emit('new-comment', comment);
  });

  // Handle reactions (likes, etc.) on a news stream
  socket.on('reaction', ({ newsId, type, username }) => {
    logger.debug('New reaction received', { newsId, reactionType: type, username });
    
    io.to(`news:${newsId}`).emit('new-reaction', {
      type,
      username,
      timestamp: new Date()
    });
  });

  // Handle live stream metadata updates
  socket.on('stream-meta', ({ newsId, metadata }) => {
    logger.debug('Stream metadata update received', { newsId, metadataTypes: Object.keys(metadata) });
    
    io.to(`news:${newsId}`).emit('stream-meta-update', {
      newsId,
      metadata,
      timestamp: new Date()
    });
  });

  // Handle location-based news alerts
  socket.on('location-update', ({ latitude, longitude }) => {
    // In a real implementation, we would find news relevant to this location
    logger.info('Client location update', { 
      socketId: socket.id, 
      latitude, 
      longitude 
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
    // Additional disconnect cleanup logic could go here
  });
});

// WebSocket connection handling for video streaming and notifications
wss.on('connection', (ws, req) => {
  logger.info('New client connected via WebSocket', {
    ip: req.socket.remoteAddress,
    url: req.url
  });

  // Extract parameters from URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const newsId = url.searchParams.get('newsId');
  const type = url.searchParams.get('type');

  // Track client information for management
  const clientInfo = {
    id: Date.now().toString(),
    type: type || 'general',
    userId: url.searchParams.get('userId'),
    lastPingTime: Date.now()
  };

  // Store client info on the connection
  ws.clientInfo = clientInfo;
  
  logger.debug('WebSocket client info initialized', { 
    clientId: clientInfo.id, 
    type: clientInfo.type,
    userId: clientInfo.userId || 'anonymous'
  });

  // Handle specific connection types
  if (type === 'notifications') {
    logger.info('WebSocket client connected for notifications', { userId: clientInfo.userId });
    // Add any notification subscription logic here

    // Send a test notification 5 seconds after connection
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const testNotification = {
          type: 'notification',
          notification: {
            id: Date.now(),
            title: 'Welcome to NewsGeo!',
            content: 'Your notifications are now active. You will receive real-time updates for news, likes, and comments.',
            type: 'news',
            time: new Date().toISOString(),
            read: false
          }
        };

        logger.debug('Sending test notification to client', { userId: clientInfo.userId });
        ws.send(JSON.stringify(testNotification));
      }
    }, 5000);
  } else if (newsId) {
    logger.info('WebSocket client connected to news stream', { newsId, clientId: clientInfo.id });

    // Set up stream if it doesn't exist
    if (!activeStreams.has(newsId)) {
      logger.debug('Creating new stream record', { newsId });
      activeStreams.set(newsId, { viewers: 0 });
    }

    // Update viewer count
    const streamInfo = activeStreams.get(newsId);
    streamInfo.viewers++;
    logger.debug('Updated viewer count for news stream', { newsId, viewers: streamInfo.viewers });

    // Notify Socket.IO clients about viewer count change
    io.to(`news:${newsId}`).emit('viewer-count', {
      newsId,
      count: streamInfo.viewers
    });
  }

  // Handle incoming WebSocket messages
  ws.on('message', (data) => {
    try {
      // Try to parse as JSON for command messages
      const jsonData = JSON.parse(data.toString());

      // Handle different message types
      if (jsonData.type === 'ping') {
        // Update last ping time
        if (ws.clientInfo) {
          ws.clientInfo.lastPingTime = Date.now();
          logger.debug('Ping received, updated lastPingTime', { 
            clientId: ws.clientInfo.id,
            userId: ws.clientInfo.userId || 'anonymous'
          });
        }

        // Send a pong response
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong', time: Date.now() }));
        }
        return;
      }

      // Handle auth messages
      if (jsonData.type === 'auth') {
        // Update client info with user ID and client type from auth
        if (ws.clientInfo) {
          if (jsonData.userId) {
            ws.clientInfo.userId = jsonData.userId;
            logger.info('WebSocket client authenticated', { 
              clientId: ws.clientInfo.id,
              userId: jsonData.userId 
            });
          }

          if (jsonData.clientType) {
            ws.clientInfo.type = jsonData.clientType;
            logger.info('WebSocket client type set', { 
              clientId: ws.clientInfo.id,
              type: jsonData.clientType,
              userId: ws.clientInfo.userId || 'anonymous'
            });

            // If we're setting to notifications type, send an immediate test notification
            if (jsonData.clientType === 'notifications') {
              // Clear any existing timeout and send immediately
              const testNotification = {
                type: 'notification',
                notification: {
                  id: Date.now(),
                  title: 'Notification System Active',
                  content: 'Your notification connection is working properly.',
                  type: 'system',
                  time: new Date().toISOString(),
                  read: false
                }
              };

              logger.debug('Sending immediate test notification to client', { 
                userId: ws.clientInfo.userId,
                clientId: ws.clientInfo.id
              });
              ws.send(JSON.stringify(testNotification));
            }
          }
        }
        return;
      }

      // Handle other JSON message types
      logger.debug('Received WebSocket message', { 
        type: jsonData.type,
        clientId: ws.clientInfo?.id,
        userId: ws.clientInfo?.userId || 'anonymous'
      });

    } catch (e) {
      // Not JSON, handle as binary data for streaming
      if (newsId && ws.readyState === WebSocket.OPEN) {
        logger.debug('Received binary data for streaming', { 
          newsId, 
          dataSize: data.length,
          clientId: ws.clientInfo?.id
        });
        
        // Broadcast the data to all other WebSocket clients watching this news
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(data);
          }
        });
      }
    }
  });

  // Handle WebSocket client disconnect
  ws.on('close', () => {
    logger.info('WebSocket client disconnected', { 
      clientId: ws.clientInfo?.id,
      userId: ws.clientInfo?.userId || 'anonymous',
      type: ws.clientInfo?.type || 'unknown'
    });

    if (newsId) {
      // Update viewer count
      const streamInfo = activeStreams.get(newsId);
      if (streamInfo && streamInfo.viewers > 0) {
        streamInfo.viewers--;
        logger.debug('Updated viewer count on WebSocket disconnect', {
          newsId,
          viewers: streamInfo.viewers
        });

        // Notify Socket.IO clients about viewer count change
        io.to(`news:${newsId}`).emit('viewer-count', {
          newsId,
          count: streamInfo.viewers
        });
      }
    }
  });

  // Send welcome message
  const welcomeMessage = {
    type: 'connected',
    message: 'Connected to NewsGeo WebSocket server',
    clientId: clientInfo.id,
    time: Date.now()
  };
  
  logger.debug('Sending welcome message to WebSocket client', { 
    clientId: clientInfo.id,
    type: clientInfo.type
  });
  
  ws.send(JSON.stringify(welcomeMessage));
});

// Heartbeat interval to clean up dead connections
setInterval(() => {
  const now = Date.now();
  let inactiveCount = 0;
  
  logger.debug('Running WebSocket heartbeat check');
  
  wss.clients.forEach((ws) => {
    if (ws.clientInfo) {
      // If no ping for 2 minutes, close the connection
      if (now - ws.clientInfo.lastPingTime > 120000) {
        logger.info('Closing inactive WebSocket connection', {
          clientId: ws.clientInfo.id,
          lastPingTime: new Date(ws.clientInfo.lastPingTime).toISOString(),
          inactiveDurationMs: now - ws.clientInfo.lastPingTime
        });
        
        ws.close(1001, 'Connection timeout');
        inactiveCount++;
      }
    }
  });
  
  if (inactiveCount > 0) {
    logger.info(`Cleaned up ${inactiveCount} inactive WebSocket connections`);
  }
  
}, 60000); // Check every minute