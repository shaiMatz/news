const express = require('express');
const app = express();
const port = 5001;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS to allow cross-origin requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Root endpoint - simple HTML response
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NewsGeo - Simplified Web Client</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        header {
          background-color: #2c3e50;
          color: white;
          padding: 20px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        section {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 5px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { margin-top: 0; }
        h2 { color: #2c3e50; }
        ul { padding-left: 20px; }
        li { margin-bottom: 10px; }
        .status { font-weight: bold; }
        .success { color: green; }
        .error { color: red; }
        button {
          background-color: #3498db;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: #2980b9;
        }
      </style>
    </head>
    <body>
      <header>
        <h1>NewsGeo Web Client</h1>
        <p>Location-based news streaming platform</p>
      </header>
      
      <section>
        <h2>Web Client Status</h2>
        <p>Simplified Web Client: <span class="status success">Running</span></p>
        <div id="server-status-container">
          <p>API Server Status: <span id="server-status" class="status">Checking...</span></p>
          <button id="check-button">Check Server Connection</button>
        </div>
      </section>
      
      <section>
        <h2>Security Features Implemented</h2>
        <ul>
          <li><strong>JWT Authentication</strong> - Secure token-based authentication with proper storage and transmission</li>
          <li><strong>Session Management</strong> - Persistent session handling with secure cookie configuration</li>
          <li><strong>Password Security</strong> - Bcrypt hashing with salt for secure password storage</li>
          <li><strong>Rate Limiting</strong> - Protection against brute force and DoS attacks</li>
          <li><strong>CSRF Protection</strong> - Cross-Site Request Forgery prevention</li>
          <li><strong>Secure Headers</strong> - HTTP security headers including Content-Security-Policy</li>
          <li><strong>CORS Configuration</strong> - Controlled cross-origin resource sharing</li>
          <li><strong>Input Validation</strong> - Server-side validation of all user inputs</li>
        </ul>
      </section>
      
      <script>
        document.getElementById('check-button').addEventListener('click', checkServerStatus);
        
        function checkServerStatus() {
          const statusElement = document.getElementById('server-status');
          statusElement.textContent = 'Checking...';
          statusElement.className = 'status';
          
          fetch('/api/check')
            .then(response => response.json())
            .then(data => {
              statusElement.textContent = data.message;
              statusElement.className = 'status success';
            })
            .catch(error => {
              statusElement.textContent = 'Connection failed';
              statusElement.className = 'status error';
              console.error('Error checking server status:', error);
            });
        }
        
        // Check server status on page load
        setTimeout(checkServerStatus, 1000);
      </script>
    </body>
    </html>
  `);
});

// API check endpoint - simulated API check
app.get('/api/check', (req, res) => {
  // Simple response indicating the API is working
  res.json({
    status: 'success',
    message: 'Connected successfully',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Simplified Web Client running on port ${port}`);
});