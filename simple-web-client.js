const express = require('express');
const app = express();
const PORT = 5001;

// Simple static response for the root path
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>NewsGeo Simple Web Client</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
          h1 { color: #2c3e50; }
          .container { max-width: 800px; margin: 0 auto; }
          .card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>NewsGeo Web Client</h1>
          
          <div class="card">
            <h2>Welcome to NewsGeo</h2>
            <p>A location-based news platform with real-time updates.</p>
            <p>The simple web client is running successfully!</p>
          </div>
          
          <div class="card">
            <h2>Security Features</h2>
            <ul>
              <li><strong>JWT Authentication</strong> - Secure token-based authentication</li>
              <li><strong>Session Support</strong> - Persistent session management</li>
              <li><strong>Password Hashing</strong> - Using bcrypt for secure password storage</li>
              <li><strong>CSRF Protection</strong> - Prevention of cross-site request forgery</li>
              <li><strong>Rate Limiting</strong> - Protection against brute force attacks</li>
              <li><strong>Secure Headers</strong> - Properly configured security headers</li>
            </ul>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple web client is running on http://0.0.0.0:${PORT}`);
});