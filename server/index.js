const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { WebSocketServer } = require('ws');
const { setupAuth } = require('./auth');
const { setupStorage } = require('./storage');
const newsRoutes = require('./routes/news');
const userRoutes = require('./routes/user');
const notificationsRoutes = require('./routes/notifications');
const streamingRoutes = require('./routes/streaming');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Set up middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.static('.'));

// Set up session storage
const storage = setupStorage();

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

// Set up API routes
app.use('/api/news', newsRoutes(storage));
app.use('/api/profile', userRoutes(storage));
app.use('/api/notifications', notificationsRoutes(storage));
app.use('/api/streams', streamingRoutes(storage));

// Serve static files
app.use(express.static(process.cwd()));

// Serve the main page at the root
app.get('/', (req, res) => {
  console.log('GET request to root endpoint');
  res.sendFile('index.html', { root: process.cwd() });
});

// Serve the test page
app.get('/test', (req, res) => {
  console.log('GET request to test endpoint');
  res.sendFile('test.html', { root: process.cwd() });
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

// Set up WebSocket Server for raw WebSocket connections
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// Define a map to track active streams by ID
const activeStreams = new Map();

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

// WebSocket connection handling (for more direct video streaming)
wss.on('connection', (ws, req) => {
  console.log('New client connected via WebSocket');
  
  // Extract newsId from URL if present
  const url = new URL(req.url, `http://${req.headers.host}`);
  const newsId = url.searchParams.get('newsId');
  
  if (newsId) {
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
  
  // Handle incoming WebSocket messages (e.g., video chunks)
  ws.on('message', (data) => {
    if (newsId && ws.readyState === ws.OPEN) {
      // Broadcast the data to all other WebSocket clients watching this news
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === client.OPEN) {
          client.send(data);
        }
      });
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
});

// Start the server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket server is running on ws://0.0.0.0:${PORT}/ws`);
  console.log(`Socket.IO server is running on http://0.0.0.0:${PORT}`);
  console.log('========================================');
  console.log('React Native client should be started separately using expo start');
  console.log('========================================');
});
