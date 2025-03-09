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
  if (!userId || !notification) return false;

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
    }
  });

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
    app.use('/api/news', newsRoutes(storage));
    app.use('/api/profile', userRoutes(storage));
    app.use('/api/notifications', notificationsRoutes(storage, { sendNotificationToUser }));
    app.use('/api/streams', streamingRoutes(storage));
    
    console.log('Database storage initialized successfully');
    
    // Start the server immediately after database initialization
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
      console.log(`WebSocket server is running on ws://0.0.0.0:${PORT}/ws`);
      console.log(`Socket.IO server is running on http://0.0.0.0:${PORT}`);
      console.log('========================================');
      console.log('React Native client should be started separately using expo start');
      console.log('========================================');
    });
    
  } catch (error) {
    console.error('Failed to initialize database storage:', error);
    process.exit(1);
  }
})();

// Serve static files
app.use(express.static(process.cwd()));

// Serve the main page at the root
app.get('/', (req, res) => {
  console.log('GET request to root endpoint');
  res.sendFile('index.html', { root: process.cwd() });
});

// Add a more specific route to serve index.html
app.get('/index.html', (req, res) => {
  console.log('GET request to index.html endpoint');
  res.sendFile('index.html', { root: process.cwd() });
});

// Serve the test page
app.get('/test', (req, res) => {
  console.log('GET request to test endpoint');
  res.sendFile('test.html', { root: process.cwd() });
});

// Serve the WebSocket test page
app.get('/websocket-test', (req, res) => {
  console.log('GET request to WebSocket test endpoint');
  res.sendFile('websocket-test.html', { root: process.cwd() });
});

// Add a test API endpoint
app.get('/api/test', (req, res) => {
  console.log('Test API endpoint accessed');
  res.json({ status: 'ok', message: 'API is working!', time: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
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
  console.log('New client connected via Socket.IO:', socket.id);

  // Handle client joining a specific news stream
  socket.on('join-stream', (newsId) => {
    console.log(`Client ${socket.id} joined stream for news ID: ${newsId}`);
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

    io.to(`news:${newsId}`).emit('viewer-count', {
      newsId,
      count: streamInfo.viewers
    });
  });

  // Handle client leaving a stream
  socket.on('leave-stream', (newsId) => {
    console.log(`Client ${socket.id} left stream for news ID: ${newsId}`);
    socket.leave(`news:${newsId}`);

    // Update viewer count
    const streamInfo = activeStreams.get(newsId);
    if (streamInfo && streamInfo.viewers > 0) {
      streamInfo.viewers--;
      activeStreams.set(newsId, streamInfo);

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

    // Broadcast comment to all viewers of this news
    io.to(`news:${newsId}`).emit('new-comment', comment);
  });

  // Handle reactions (likes, etc.) on a news stream
  socket.on('reaction', ({ newsId, type, username }) => {
    io.to(`news:${newsId}`).emit('new-reaction', {
      type,
      username,
      timestamp: new Date()
    });
  });

  // Handle live stream metadata updates
  socket.on('stream-meta', ({ newsId, metadata }) => {
    io.to(`news:${newsId}`).emit('stream-meta-update', {
      newsId,
      metadata,
      timestamp: new Date()
    });
  });

  // Handle location-based news alerts
  socket.on('location-update', ({ latitude, longitude }) => {
    // In a real implementation, we would find news relevant to this location
    // For now, just log it
    console.log(`Client ${socket.id} updated location: ${latitude}, ${longitude}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Additional disconnect cleanup logic could go here
  });
});

// WebSocket connection handling for video streaming and notifications
wss.on('connection', (ws, req) => {
  console.log('New client connected via WebSocket');

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

  // Handle specific connection types
  if (type === 'notifications') {
    console.log(`WebSocket client connected for notifications, userId: ${clientInfo.userId}`);
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

        console.log('Sending test notification to client');
        ws.send(JSON.stringify(testNotification));
      }
    }, 5000);
  } else if (newsId) {
    console.log(`WebSocket client connected to news ID: ${newsId}`);

    // Set up stream if it doesn't exist
    if (!activeStreams.has(newsId)) {
      activeStreams.set(newsId, { viewers: 0 });
    }

    // Update viewer count
    const streamInfo = activeStreams.get(newsId);
    streamInfo.viewers++;

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
            console.log(`WebSocket client authenticated: ${jsonData.userId}`);
          }

          if (jsonData.clientType) {
            ws.clientInfo.type = jsonData.clientType;
            console.log(`WebSocket client type set to: ${jsonData.clientType}`);

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

              console.log('Sending immediate test notification to client');
              ws.send(JSON.stringify(testNotification));
            }
          }
        }
        return;
      }

      // Handle other JSON message types
      console.log(`Received message type: ${jsonData.type}`);

    } catch (e) {
      // Not JSON, handle as binary data for streaming
      if (newsId && ws.readyState === WebSocket.OPEN) {
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
    console.log('WebSocket client disconnected');

    if (newsId) {
      // Update viewer count
      const streamInfo = activeStreams.get(newsId);
      if (streamInfo && streamInfo.viewers > 0) {
        streamInfo.viewers--;

        // Notify Socket.IO clients about viewer count change
        io.to(`news:${newsId}`).emit('viewer-count', {
          newsId,
          count: streamInfo.viewers
        });
      }
    }
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to NewsGeo WebSocket server',
    clientId: clientInfo.id,
    time: Date.now()
  }));
});

// Heartbeat interval to clean up dead connections
setInterval(() => {
  const now = Date.now();
  wss.clients.forEach((ws) => {
    if (ws.clientInfo) {
      // If no ping for 2 minutes, close the connection
      if (now - ws.clientInfo.lastPingTime > 120000) {
        console.log('Closing inactive WebSocket connection');
        ws.close(1001, 'Connection timeout');
      }
    }
  });
}, 60000); // Check every minute