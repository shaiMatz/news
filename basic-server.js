const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.static('.'));
app.use(express.json());

// Basic homepage
app.get('/', (req, res) => {
  console.log('Received request to homepage');
  res.send(`
    <html>
      <head>
        <title>Basic NewsGeo Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; }
          h1 { color: #2563EB; }
          .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Basic NewsGeo Server</h1>
          <div class="card">
            <p>Server is running!</p>
            <p>Current time: ${new Date().toLocaleString()}</p>
            <p><a href="/api/test">Test the API</a></p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  console.log('API test endpoint accessed');
  res.json({
    status: 'ok',
    message: 'API is working!',
    time: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Basic server is running on http://0.0.0.0:${PORT}`);
});