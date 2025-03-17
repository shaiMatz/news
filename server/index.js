const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { WebSocketServer, WebSocket } = require('ws');
const { setupAuth } = require('./auth');
const { setupStorage } = require('./database-storage');
const newsRoutes = require('./routes/news');
const userRoutes = require('./routes/user');
const notificationsRoutes = require('./routes/notifications');
const streamingRoutes = require('./routes/streaming');
const passwordResetRoutes = require('./routes/password-reset');
const logger = require('./utils/logger').createLogger('server');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const httpServer = createServer(app);
const origin = ['http://localhost:3000', 'http://0.0.0.0:3000', 'http://localhost:8081', 'http://0.0.0.0:8081'];

// Configure CORS and JSON body parsing
app.use(cors({
  origin: origin,
  credentials: true
}));
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Global map for active streams
const activeStreams = new Map();

// Set up session middleware and storage once
(async () => {
  try {
    const storage = await setupStorage();

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

    // Set up authentication (do not reinitialize session in auth.js)
    setupAuth(app, storage);

    // API routes
    logger.info('Setting up API routes');
    app.use('/api/news', newsRoutes(storage));
    app.use('/api/profile', userRoutes(storage));
    app.use('/api/notifications', notificationsRoutes(storage, { sendNotificationToUser }));
    app.use('/api/streams', streamingRoutes(storage));
    app.use('/api/user', userRoutes(storage));
    app.use('/api/password-reset', passwordResetRoutes(storage));

    logger.info('Database storage initialized successfully');

    // Start the HTTP server
    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info('========================================');
      logger.info(`Server is running on http://0.0.0.0:${PORT}`);
      logger.info(`WebSocket server is running on ws://0.0.0.0:${PORT}/ws`);
      logger.info(`Socket.IO server is running on http://0.0.0.0:${PORT}`);
      logger.info('========================================');
    });
  } catch (error) {
    logger.error('Failed to initialize database storage', error);
    process.exit(1);
  }
})();

// Set up Socket.IO for structured real-time events
const io = new Server(httpServer, {
  cors: {
    origin: origin,
    credentials: true
  },
  transports: ['websocket', 'polling']
});

io.on('connection', (socket) => {
  logger.info('New client connected via Socket.IO', { socketId: socket.id, ip: socket.handshake.address });

  socket.on('join-stream', (newsId) => {
    logger.info('Client joined stream', { socketId: socket.id, newsId });
    socket.join(`news:${newsId}`);
    socket.to(`news:${newsId}`).emit('viewer-joined', {
      viewerId: socket.id,
      timestamp: new Date()
    });
    const streamInfo = activeStreams.get(newsId) || { viewers: 0 };
    streamInfo.viewers++;
    activeStreams.set(newsId, streamInfo);
    logger.debug('Updated viewer count', { newsId, viewers: streamInfo.viewers });
    io.to(`news:${newsId}`).emit('viewer-count', {
      newsId,
      count: streamInfo.viewers
    });
  });

  socket.on('leave-stream', (newsId) => {
    logger.info('Client left stream', { socketId: socket.id, newsId });
    socket.leave(`news:${newsId}`);
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

  socket.on('comment', ({ newsId, text, username }) => {
    const comment = {
      id: Date.now(),
      text,
      username,
      timestamp: new Date()
    };
    logger.debug('New comment received', { newsId, username, commentId: comment.id });
    io.to(`news:${newsId}`).emit('new-comment', comment);
  });

  socket.on('reaction', ({ newsId, type, username }) => {
    logger.debug('New reaction received', { newsId, reactionType: type, username });
    io.to(`news:${newsId}`).emit('new-reaction', {
      type,
      username,
      timestamp: new Date()
    });
  });

  socket.on('stream-meta', ({ newsId, metadata }) => {
    logger.debug('Stream metadata update received', { newsId, metadataTypes: Object.keys(metadata) });
    io.to(`news:${newsId}`).emit('stream-meta-update', {
      newsId,
      metadata,
      timestamp: new Date()
    });
  });

  socket.on('location-update', ({ latitude, longitude }) => {
    logger.info('Client location update', { socketId: socket.id, latitude, longitude });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// Consolidated WebSocket server for raw connections (notifications and streaming)
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
// Define the utility function before it's used in routes
const sendNotificationToUser = (userId, notification) => {
  logger.debug('Attempting to send notification to user', { userId, notificationType: notification.type });
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

wss.on('connection', (ws, req) => {
  // Parse URL parameters from the connection request
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const newsId = urlObj.searchParams.get('newsId');
  const type = urlObj.searchParams.get('type');
  const userId = urlObj.searchParams.get('userId');

  // Initialize client info
  const clientInfo = {
    id: Date.now().toString(),
    lastPingTime: Date.now(),
    type: type || 'general',
    userId: userId || null
  };
  ws.clientInfo = clientInfo;

  logger.info('WebSocket client connected', { clientId: clientInfo.id, ip: req.socket.remoteAddress, url: req.url });

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const jsonData = JSON.parse(data.toString());
      if (jsonData.type === 'ping') {
        ws.clientInfo.lastPingTime = Date.now();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong', time: Date.now() }));
        }
        return;
      }
      if (jsonData.type === 'auth') {
        if (ws.clientInfo) {
          if (jsonData.userId) {
            ws.clientInfo.userId = jsonData.userId;
            logger.info('WebSocket client authenticated', { clientId: ws.clientInfo.id, userId: jsonData.userId });
          }
          if (jsonData.clientType) {
            ws.clientInfo.type = jsonData.clientType;
            logger.info('WebSocket client type set', { clientId: ws.clientInfo.id, type: jsonData.clientType, userId: ws.clientInfo.userId || 'anonymous' });
            if (jsonData.clientType === 'notifications' && ws.readyState === WebSocket.OPEN) {
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
              ws.send(JSON.stringify(testNotification));
            }
          }
        }
        return;
      }
      logger.debug('Received WebSocket message', { type: jsonData.type, clientId: ws.clientInfo?.id, userId: ws.clientInfo?.userId || 'anonymous' });
    } catch (e) {
      // If not JSON, treat as binary data for streaming (if newsId is present)
      if (newsId && ws.readyState === WebSocket.OPEN) {
        logger.debug('Received binary data for streaming', { newsId, dataSize: data.length, clientId: ws.clientInfo?.id });
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(data);
          }
        });
      }
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket client disconnected', {
      clientId: ws.clientInfo?.id,
      userId: ws.clientInfo?.userId || 'anonymous',
      type: ws.clientInfo?.type || 'unknown'
    });
    if (newsId) {
      const streamInfo = activeStreams.get(newsId);
      if (streamInfo && streamInfo.viewers > 0) {
        streamInfo.viewers--;
        logger.debug('Updated viewer count on WebSocket disconnect', { newsId, viewers: streamInfo.viewers });
        io.to(`news:${newsId}`).emit('viewer-count', {
          newsId,
          count: streamInfo.viewers
        });
      }
    }
  });

  // Specific behavior based on connection type
  if (clientInfo.type === 'notifications') {
    logger.info('WebSocket client connected for notifications', { userId: clientInfo.userId });
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
        ws.send(JSON.stringify(testNotification));
      }
    }, 5000);
  } else if (newsId) {
    logger.info('WebSocket client connected to news stream', { newsId, clientId: clientInfo.id });
    if (!activeStreams.has(newsId)) {
      logger.debug('Creating new stream record', { newsId });
      activeStreams.set(newsId, { viewers: 0 });
    }
    const streamInfo = activeStreams.get(newsId);
    streamInfo.viewers++;
    logger.debug('Updated viewer count for news stream', { newsId, viewers: streamInfo.viewers });
    io.to(`news:${newsId}`).emit('viewer-count', {
      newsId,
      count: streamInfo.viewers
    });
  }

  // Send a welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to NewsGeo WebSocket server',
    clientId: clientInfo.id,
    time: Date.now()
  }));
});

// Heartbeat to close inactive WebSocket connections
setInterval(() => {
  const now = Date.now();
  let inactiveCount = 0;
  logger.debug('Running WebSocket heartbeat check');
  wss.clients.forEach((ws) => {
    if (ws.clientInfo && now - ws.clientInfo.lastPingTime > 120000) {
      logger.info('Closing inactive WebSocket connection', {
        clientId: ws.clientInfo.id,
        lastPingTime: new Date(ws.clientInfo.lastPingTime).toISOString(),
        inactiveDurationMs: now - ws.clientInfo.lastPingTime
      });
      ws.close(1001, 'Connection timeout');
      inactiveCount++;
    }
  });
  if (inactiveCount > 0) {
    logger.info(`Cleaned up ${inactiveCount} inactive WebSocket connections`);
  }
}, 60000);

// Static file and test routes
app.get('/', (req, res) => {
  logger.debug('GET request to root endpoint', { ip: req.ip });
  res.sendFile('index.html', { root: path.join(process.cwd(), 'public') });
});
app.get('/index.html', (req, res) => {
  logger.debug('GET request to index.html endpoint', { ip: req.ip });
  res.sendFile('index.html', { root: path.join(process.cwd(), 'public') });
});
app.get('/test', (req, res) => {
  logger.debug('GET request to test endpoint', { ip: req.ip });
  res.sendFile('test.html', { root: path.join(process.cwd(), 'public') });
});
app.get('/websocket-test', (req, res) => {
  logger.debug('GET request to WebSocket test endpoint', { ip: req.ip });
  res.sendFile('websocket-test.html', { root: path.join(process.cwd(), 'public') });
});
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
