const express = require('express');
const path = require('path');
const cors = require('cors');
const { createServer } = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 5002;
const serverPort = 5000; // Backend server port

// Create a proper HTTP server
const httpServer = createServer(app);

// Enable CORS for all routes
app.use(cors());

// Serve static content
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory data store
const news = [
  { id: 1, title: 'Local Event This Weekend', summary: 'A community event is happening nearby.', location: 'Downtown' },
  { id: 2, title: 'Weather Alert', summary: 'Expect rain showers in your area tomorrow.', location: 'Citywide' },
  { id: 3, title: 'Traffic Update', summary: 'Road construction on Main Street may cause delays.', location: 'Main St' }
];

// Set up a WebSocket server for mobile client communication
const wss = new WebSocket.Server({ server: httpServer, path: '/mobile-ws' });

wss.on('connection', (ws) => {
  console.log('Mobile client connected via WebSocket');
  
  // Send initial news data
  ws.send(JSON.stringify({
    type: 'news',
    data: news
  }));
  
  // Handle messages from mobile clients
  ws.on('message', (message) => {
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
      console.log('Received message from mobile client:', parsedMessage);
      
      if (parsedMessage.type === 'getNews') {
        const { lat, lng } = parsedMessage.data || {};
        console.log(`Mobile client requested news at location: ${lat || 'unknown'}, ${lng || 'unknown'}`);
        
        // Return news data to mobile client
        ws.send(JSON.stringify({
          type: 'news',
          data: news,
          location: lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'unknown'
        }));
      } else if (parsedMessage.type === 'auth') {
        // Mock authentication response
        ws.send(JSON.stringify({
          type: 'authResponse',
          data: { 
            success: true, 
            user: { 
              id: 1, 
              username: 'demo_user',
              email: 'demo@example.com'
            }
          }
        }));
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  // Send a ping every 30 seconds to keep the connection alive
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    }
  }, 30000);
  
  ws.on('close', () => {
    console.log('Mobile client disconnected');
    clearInterval(interval);
  });
});

// API endpoint to get news (REST API for web clients)
app.get('/api/news', (req, res) => {
  const { lat, lng } = req.query;
  console.log(`Web client requested news at location: ${lat || 'unknown'}, ${lng || 'unknown'}`);
  
  res.json(news);
});

// Serve a demo HTML page for the web client with a WebSocket demo
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>NewsGeo React Native Web Demo</title>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; font-family: Arial, sans-serif; }
          #root { display: flex; flex-direction: column; height: 100%; }
          header { background-color: #2c3e50; color: white; padding: 1rem; text-align: center; }
          main { flex: 1; padding: 1rem; }
          .loading { display: flex; justify-content: center; align-items: center; height: 100%; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .news-card { background-color: #f8f9fa; }
          button { background-color: #3498db; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-right: 0.5rem; }
          button:hover { background-color: #2980b9; }
          footer { background-color: #34495e; color: white; padding: 1rem; text-align: center; }
          .status-connected { color: #2ecc71; }
          .status-disconnected { color: #e74c3c; }
          .tabs { display: flex; border-bottom: 1px solid #ddd; margin-bottom: 1rem; }
          .tab { padding: 0.5rem 1rem; cursor: pointer; }
          .tab.active { border-bottom: 2px solid #3498db; font-weight: bold; }
          .tab-content { display: none; }
          .tab-content.active { display: block; }
        </style>
      </head>
      <body>
        <div id="root">
          <header>
            <h1>NewsGeo</h1>
            <p>Your location-based news platform</p>
          </header>
          
          <main>
            <div class="tabs">
              <div class="tab active" data-tab="web-client">Web Client</div>
              <div class="tab" data-tab="mobile-simulator">Mobile Client Simulator</div>
            </div>
            
            <div id="web-client" class="tab-content active">
              <div class="card">
                <h2>Welcome to NewsGeo Web Client</h2>
                <p>This demo shows how our web client interacts with the server.</p>
                <p>Backend Status: <span id="server-status">Checking...</span></p>
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
            </div>
            
            <div id="mobile-simulator" class="tab-content">
              <div class="card">
                <h2>Mobile Client WebSocket Simulator</h2>
                <p>This demonstrates how the mobile app would communicate with the server via WebSockets.</p>
                <p>WebSocket Status: <span id="ws-status" class="status-disconnected">Disconnected</span></p>
                <button id="ws-connect">Connect</button>
                <button id="ws-disconnect" disabled>Disconnect</button>
              </div>
              
              <div class="card">
                <h2>Simulate User Location</h2>
                <form id="location-form">
                  <div style="margin-bottom: 0.5rem;">
                    <label for="lat">Latitude:</label>
                    <input type="text" id="lat" value="40.7128" style="margin-right: 1rem;">
                    <label for="lng">Longitude:</label>
                    <input type="text" id="lng" value="-74.0060">
                  </div>
                  <button type="submit">Send Location</button>
                </form>
              </div>
              
              <div class="card">
                <h2>Authentication</h2>
                <button id="simulate-login">Simulate Login</button>
              </div>
              
              <div class="card">
                <h2>Received Messages</h2>
                <div id="ws-messages">
                  <div class="loading">No messages yet</div>
                </div>
              </div>
            </div>
          </main>
          
          <footer>
            <p>&copy; 2025 NewsGeo - All rights reserved</p>
          </footer>
        </div>
        
        <script>
          // Tab switching
          document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
              document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
              document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
              
              tab.classList.add('active');
              document.getElementById(tab.dataset.tab).classList.add('active');
            });
          });
          
          // Web client functionality
          // Check server status
          fetch('http://0.0.0.0:${serverPort}/api/news')
            .then(response => {
              document.getElementById('server-status').textContent = 
                response.ok ? 'Connected' : 'Error connecting';
            })
            .catch(error => {
              document.getElementById('server-status').textContent = 'Error: ' + error.message;
            });
          
          // Location detection for web client
          document.getElementById('get-location').addEventListener('click', () => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                position => {
                  const lat = position.coords.latitude;
                  const lng = position.coords.longitude;
                  document.getElementById('location').textContent = \`\${lat.toFixed(4)}, \${lng.toFixed(4)}\`;
                  
                  // Fetch news for this location
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
          
          // Function to fetch news
          function fetchNewsForLocation(lat, lng) {
            const newsContainer = document.getElementById('news-container');
            newsContainer.innerHTML = '<div class="loading">Fetching news for your location...</div>';
            
            fetch(\`/api/news?lat=\${lat}&lng=\${lng}\`)
              .then(response => response.json())
              .then(data => {
                newsContainer.innerHTML = '';
                data.forEach(item => {
                  const newsItem = document.createElement('div');
                  newsItem.className = 'card news-card';
                  newsItem.innerHTML = \`
                    <h3>\${item.title}</h3>
                    <p>\${item.summary}</p>
                    <small>Location: \${item.location || 'Unknown'}</small>
                  \`;
                  newsContainer.appendChild(newsItem);
                });
              })
              .catch(error => {
                newsContainer.innerHTML = \`<p>Error loading news: \${error.message}</p>\`;
              });
          }
          
          // Mobile client simulator functionality
          let ws = null;
          const wsStatusEl = document.getElementById('ws-status');
          const wsMessagesEl = document.getElementById('ws-messages');
          const connectBtn = document.getElementById('ws-connect');
          const disconnectBtn = document.getElementById('ws-disconnect');
          
          // Connect to WebSocket server
          connectBtn.addEventListener('click', () => {
            if (ws && ws.readyState === WebSocket.OPEN) return;
            
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = \`\${protocol}//\${window.location.host}/mobile-ws\`;
            
            try {
              ws = new WebSocket(wsUrl);
              
              ws.onopen = () => {
                wsStatusEl.textContent = 'Connected';
                wsStatusEl.className = 'status-connected';
                connectBtn.disabled = true;
                disconnectBtn.disabled = false;
                logWsMessage('System', 'WebSocket connection established');
              };
              
              ws.onmessage = (event) => {
                try {
                  const message = JSON.parse(event.data);
                  logWsMessage('Server', message);
                  
                  if (message.type === 'news') {
                    displayNews(message.data);
                  }
                } catch (error) {
                  logWsMessage('Error', 'Failed to parse message: ' + error.message);
                }
              };
              
              ws.onerror = (error) => {
                logWsMessage('Error', 'WebSocket error: ' + error.message);
              };
              
              ws.onclose = () => {
                wsStatusEl.textContent = 'Disconnected';
                wsStatusEl.className = 'status-disconnected';
                connectBtn.disabled = false;
                disconnectBtn.disabled = true;
                logWsMessage('System', 'WebSocket connection closed');
                ws = null;
              };
            } catch (error) {
              logWsMessage('Error', 'Failed to connect: ' + error.message);
            }
          });
          
          // Disconnect from WebSocket server
          disconnectBtn.addEventListener('click', () => {
            if (ws) {
              ws.close();
            }
          });
          
          // Send location to server
          document.getElementById('location-form').addEventListener('submit', (event) => {
            event.preventDefault();
            
            if (!ws || ws.readyState !== WebSocket.OPEN) {
              alert('WebSocket is not connected. Please connect first.');
              return;
            }
            
            const lat = parseFloat(document.getElementById('lat').value);
            const lng = parseFloat(document.getElementById('lng').value);
            
            if (isNaN(lat) || isNaN(lng)) {
              alert('Please enter valid coordinates.');
              return;
            }
            
            const message = {
              type: 'getNews',
              data: { lat, lng }
            };
            
            ws.send(JSON.stringify(message));
            logWsMessage('Client', message);
          });
          
          // Simulate login
          document.getElementById('simulate-login').addEventListener('click', () => {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
              alert('WebSocket is not connected. Please connect first.');
              return;
            }
            
            const message = {
              type: 'auth',
              data: {
                username: 'demo_user',
                password: 'password123'
              }
            };
            
            ws.send(JSON.stringify(message));
            logWsMessage('Client', {
              type: 'auth',
              data: {
                username: 'demo_user',
                password: '******'
              }
            });
          });
          
          // Helper to log WebSocket messages
          function logWsMessage(source, message) {
            const messageEl = document.createElement('div');
            messageEl.className = 'card';
            
            const timestamp = new Date().toLocaleTimeString();
            const messageStr = typeof message === 'object' ? 
              JSON.stringify(message, null, 2) : message;
            
            messageEl.innerHTML = \`
              <strong>\${source} (\${timestamp}):</strong>
              <pre style="background-color: #f8f9fa; padding: 0.5rem; overflow: auto; max-height: 150px;">\${messageStr}</pre>
            \`;
            
            if (wsMessagesEl.querySelector('.loading')) {
              wsMessagesEl.innerHTML = '';
            }
            
            wsMessagesEl.insertBefore(messageEl, wsMessagesEl.firstChild);
          }
          
          // Display news items
          function displayNews(newsItems) {
            const newsContainer = document.getElementById('news-container');
            newsContainer.innerHTML = '';
            
            newsItems.forEach(item => {
              const newsItem = document.createElement('div');
              newsItem.className = 'card news-card';
              newsItem.innerHTML = \`
                <h3>\${item.title}</h3>
                <p>\${item.summary}</p>
                <small>Location: \${item.location || 'Unknown'}</small>
              \`;
              newsContainer.appendChild(newsItem);
            });
          }
          
          // Auto-fetch news on page load
          window.addEventListener('load', () => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                position => {
                  const lat = position.coords.latitude;
                  const lng = position.coords.longitude;
                  document.getElementById('location').textContent = \`\${lat.toFixed(4)}, \${lng.toFixed(4)}\`;
                  fetchNewsForLocation(lat, lng);
                },
                error => {
                  document.getElementById('location').textContent = 'Error: ' + error.message;
                  fetchNewsForLocation(null, null);
                }
              );
            } else {
              document.getElementById('location').textContent = 'Geolocation is not supported by this browser.';
              fetchNewsForLocation(null, null);
            }
          });
        </script>
      </body>
    </html>
  `);
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`React Native Client Server is running on http://0.0.0.0:${PORT}`);
  console.log(`Mobile WebSocket endpoint available at ws://0.0.0.0:${PORT}/mobile-ws`);
  console.log('========================================');
  console.log('Ready to serve web requests and mobile connections');
  console.log('========================================');
});