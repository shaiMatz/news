const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5002;

// Enable CORS for all routes
app.use(cors());

// Simple in-memory data store
const news = [
  { id: 1, title: 'Local Event This Weekend', summary: 'A community event is happening nearby.' },
  { id: 2, title: 'Weather Alert', summary: 'Expect rain showers in your area tomorrow.' },
  { id: 3, title: 'Traffic Update', summary: 'Road construction on Main Street may cause delays.' }
];

// Serve static content
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get news
app.get('/api/news', (req, res) => {
  const { lat, lng } = req.query;
  console.log(`Received request for news at location: ${lat || 'unknown'}, ${lng || 'unknown'}`);
  
  // In a real app, we would filter news by location
  res.json(news);
});

// Main route - if not hit by static middleware
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`React Native Web client is running on http://0.0.0.0:${PORT}`);
  console.log('========================================');
  console.log('Ready to serve web requests');
  console.log('========================================');
});