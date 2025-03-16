const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.CLIENT_PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

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
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`React Native Web client running on http://0.0.0.0:${PORT}`);
});