const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;
const SERVER_PORT = 5000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the public directory
app.use(express.static('public'));

// Serve all static files from src directory
app.use('/src', express.static('src'));

// Serve node_modules for browser imports
app.use('/node_modules', express.static('node_modules'));

// API proxy to forward requests to the server running on port 5000
app.use('/api', (req, res, next) => {
  console.log(`Proxying API request to: ${req.url}`);
  // Forward the request to the actual API server
  fetch(`http://localhost:${SERVER_PORT}${req.url}`, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...req.headers
    },
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
  })
  .then(response => {
    return response.json().then(data => {
      res.status(response.status).json(data);
    });
  })
  .catch(error => {
    console.error('API Proxy error:', error);
    res.status(500).json({ error: 'Error proxying to API server' });
  });
});

// Serve a welcome page at the root to confirm the web client is working
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>NewsGeo Web Client</title>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; font-family: Arial, sans-serif; }
          .container { max-width: 800px; margin: 0 auto; padding: 2rem; }
          header { background-color: #2c3e50; color: white; padding: 1rem; text-align: center; margin-bottom: 2rem; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .button { background-color: #3498db; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
          .button:hover { background-color: #2980b9; }
          footer { margin-top: 2rem; text-align: center; color: #777; }
        </style>
      </head>
      <body>
        <header>
          <h1>NewsGeo Web Client</h1>
          <p>Your location-based news platform</p>
        </header>
        
        <div class="container">
          <div class="card">
            <h2>Welcome to NewsGeo</h2>
            <p>This is the web client for the NewsGeo platform. You can access the following features:</p>
            <ul>
              <li>View location-based news</li>
              <li>Authenticate with the platform</li>
              <li>Follow other users</li>
              <li>Receive notifications</li>
            </ul>
            <a href="/auth" class="button">Go to Authentication</a>
          </div>
          
          <div class="card">
            <h2>Server Status</h2>
            <p>Web Client: <span style="color: green;">Running</span></p>
            <p>API Server Status: <span id="server-status">Checking...</span></p>
            <button id="check-server" class="button">Check API Server</button>
          </div>
        </div>
        
        <footer>
          <p>&copy; 2025 NewsGeo - All rights reserved</p>
        </footer>
        
        <script>
          // Check API server status
          document.getElementById('check-server').addEventListener('click', function() {
            const statusEl = document.getElementById('server-status');
            statusEl.textContent = 'Checking...';
            
            fetch('/api/test')
              .then(response => {
                if (response.ok) {
                  return response.json();
                }
                throw new Error('Failed to connect to API server');
              })
              .then(data => {
                statusEl.textContent = 'Connected - ' + data.message;
                statusEl.style.color = 'green';
              })
              .catch(error => {
                statusEl.textContent = 'Error: ' + error.message;
                statusEl.style.color = 'red';
              });
          });
          
          // Check status on page load
          document.getElementById('check-server').click();
        </script>
      </body>
    </html>
  `);
});

// Serve the auth page
app.get('/auth', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Catch-all route: serve the main index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web client is running on http://0.0.0.0:${PORT}`);
  console.log('========================================');
  console.log('Ready to serve web requests');
  console.log('========================================');
});