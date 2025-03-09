const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
// For compatibility with Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
// Getting hostname for proper API and WebSocket URLs
const os = require('os');

const app = express();
const PORT = process.env.PORT || 5001;
const SERVER_PORT = 5000;

// Get hostname for internal communication
const hostname = process.env.REPL_SLUG ? 
  `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 
  'localhost';

// Enable CORS for all routes with credentials support
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON request bodies
app.use(bodyParser.json());

// Serve static files from the public directory
app.use(express.static('public'));

// Serve all static files from src directory
app.use('/src', express.static('src'));

// Serve node_modules for browser imports
app.use('/node_modules', express.static('node_modules'));

// API proxy to forward requests to the server running on port 5000
app.use('/api', (req, res) => {
  console.log(`Proxying API request to: ${req.url}, Method: ${req.method}`);
  
  // Extract cookies to forward
  const cookies = req.headers.cookie;
  
  // Extract authorization header for JWT tokens
  const authHeader = req.headers.authorization;
  
  // Prepare headers for the proxied request
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Add cookies if available
  if (cookies) {
    headers['Cookie'] = cookies;
  }
  
  // Add authorization header if available
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }
  
  // Prepare request body for non-GET requests
  let requestBody = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    requestBody = JSON.stringify(req.body);
    console.log(`Request body: ${requestBody}`);
  }
  
  // Forward the request to the actual API server
  const apiUrl = process.env.REPL_SLUG ? 
    `https://${hostname}:${SERVER_PORT}${req.url}` : 
    `http://localhost:${SERVER_PORT}${req.url}`;
    
  console.log(`Proxying to: ${apiUrl}`);
    
  fetch(apiUrl, {
    method: req.method,
    headers: headers,
    body: requestBody,
    // Required to handle cookies correctly
    credentials: 'include'
  })
  .then(response => {
    // Copy all headers from the API response to our response
    const responseHeaders = response.headers.raw();
    Object.keys(responseHeaders).forEach(key => {
      // Skip content-encoding as it can cause issues
      if (key !== 'content-encoding') {
        const value = responseHeaders[key];
        res.set(key, value);
      }
    });
    
    // Set the response status code
    res.status(response.status);
    
    // Return response based on content type
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return response.json()
        .then(data => {
          res.json(data);
        })
        .catch(error => {
          console.error('Error parsing JSON response:', error);
          res.send('');
        });
    } else {
      return response.text()
        .then(text => {
          res.send(text);
        });
    }
  })
  .catch(error => {
    console.error('API Proxy error:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Error proxying to API server',
      details: error.message
    });
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
            <h2>Security Features</h2>
            <p>This application implements the following security measures:</p>
            <ul>
              <li><strong>JWT Authentication</strong> - Secure token-based authentication</li>
              <li><strong>Session Support</strong> - Persistent session management</li>
              <li><strong>Password Hashing</strong> - Using bcrypt for secure password storage</li>
              <li><strong>CSRF Protection</strong> - Prevention of cross-site request forgery</li>
              <li><strong>Rate Limiting</strong> - Protection against brute force attacks</li>
              <li><strong>Secure Headers</strong> - Properly configured security headers</li>
              <li><strong>CORS Configuration</strong> - Controlled cross-origin resource sharing</li>
            </ul>
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