const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5002;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the public directory
app.use(express.static('public'));

// Serve all static files from src directory
app.use('/src', express.static('src'));

// Serve node_modules for browser imports
app.use('/node_modules', express.static('node_modules'));

// API proxy to forward requests to the server running on port 5000
app.use('/api', (req, res) => {
  console.log(`Proxying API request to: ${req.url}`);
  // The actual forwarding will be handled by the NewsGeo server on port 5000
  res.status(404).json({ error: 'API endpoint not found' });
});

// Create a simple HTML page for React Native Web
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>NewsGeo React Native Web</title>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; font-family: Arial, sans-serif; }
          #root { display: flex; flex-direction: column; height: 100%; }
          header { background-color: #2c3e50; color: white; padding: 1rem; text-align: center; }
          main { flex: 1; padding: 1rem; }
          .loading { display: flex; justify-content: center; align-items: center; height: 100%; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          footer { background-color: #34495e; color: white; padding: 1rem; text-align: center; }
        </style>
      </head>
      <body>
        <div id="root">
          <header>
            <h1>NewsGeo</h1>
            <p>Your location-based news platform</p>
          </header>
          <main>
            <div class="card">
              <h2>Welcome to NewsGeo</h2>
              <p>This is a simplified React Native Web client. The full application is under development.</p>
              <p>Server Status: <span id="server-status">Checking...</span></p>
            </div>
            <div class="card">
              <h2>Location Services</h2>
              <p>Your current location: <span id="location">Detecting...</span></p>
              <button id="get-location">Update Location</button>
            </div>
            <div class="card">
              <h2>Latest News</h2>
              <div id="news-container">
                <div class="loading">Loading news...</div>
              </div>
            </div>
          </main>
          <footer>
            <p>&copy; 2025 NewsGeo - All rights reserved</p>
          </footer>
        </div>
        <script>
          // Check server status
          fetch('http://0.0.0.0:5000/api/user')
            .then(response => {
              document.getElementById('server-status').textContent = 
                response.ok ? 'Connected' : 'Error connecting';
            })
            .catch(error => {
              document.getElementById('server-status').textContent = 'Error: ' + error.message;
            });
          
          // Location detection
          document.getElementById('get-location').addEventListener('click', () => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                position => {
                  const lat = position.coords.latitude;
                  const lng = position.coords.longitude;
                  document.getElementById('location').textContent = \`\${lat.toFixed(4)}, \${lng.toFixed(4)}\`;
                  
                  // You could fetch news for this location here
                  fetchNewsForLocation(lat, lng);
                },
                error => {
                  document.getElementById('location').textContent = 'Error: ' + error.message;
                }
              );
            } else {
              document.getElementById('location').textContent = 'Geolocation is not supported by this browser.';
            }
          });
          
          // Mock function to fetch news
          function fetchNewsForLocation(lat, lng) {
            const newsContainer = document.getElementById('news-container');
            newsContainer.innerHTML = '<div class="loading">Fetching news for your location...</div>';
            
            // In a real app, you would fetch from the server with actual lat/lng
            setTimeout(() => {
              const mockNews = [
                { title: 'Local Event This Weekend', summary: 'A community event is happening nearby.' },
                { title: 'Weather Alert', summary: 'Expect rain showers in your area tomorrow.' },
                { title: 'Traffic Update', summary: 'Road construction on Main Street may cause delays.' }
              ];
              
              newsContainer.innerHTML = '';
              mockNews.forEach(item => {
                const newsItem = document.createElement('div');
                newsItem.className = 'card';
                newsItem.innerHTML = \`
                  <h3>\${item.title}</h3>
                  <p>\${item.summary}</p>
                \`;
                newsContainer.appendChild(newsItem);
              });
            }, 1500);
          }
        </script>
      </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`React Native Web client is running on http://0.0.0.0:${PORT}`);
  console.log('========================================');
  console.log('Ready to serve web requests');
  console.log('========================================');
});