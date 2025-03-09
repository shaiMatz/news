const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));

// Serve all static files from src directory
app.use('/src', express.static('src'));

// Serve node_modules for browser imports
app.use('/node_modules', express.static('node_modules'));

// Always return the main index.html for any request
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web client is running on http://0.0.0.0:${PORT}`);
  console.log('========================================');
  console.log('Make sure the server is running on port 5000');
  console.log('========================================');
});