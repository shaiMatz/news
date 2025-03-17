const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.CLIENT_PORT || 3000; // Using 3000 since 5000 is used by NewsGeo Server

// Enable CORS for all routes with specific settings
app.use(cors({
  origin: ['http://localhost:5000', 'http://0.0.0.0:5000', 'http://localhost:3000', 'http://0.0.0.0:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Enable body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up API proxy to forward requests to the backend server
app.use('/api', createProxyMiddleware({
  target: 'http://0.0.0.0:5000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api' // no rewrite needed
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} request to: ${proxyReq.path}`);
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Add health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'NewsGeo client is running!'
  });
});

// Add ping endpoint for web_application_feedback_tool
app.get('/ping', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    uptime: process.uptime(),
    message: 'NewsGeo client is running!',
    time: new Date().toISOString() 
  });
});

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send({
    error: {
      type: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  });
});

// Root route that serves the main HTML
app.get('/*', (req, res) => {
  console.log(`Request for: ${req.url}`);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`React Native Web client running on http://0.0.0.0:${PORT}`);
});