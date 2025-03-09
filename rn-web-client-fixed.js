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

// Simple in-memory data store for demo purposes
const news = [
  { 
    id: 1, 
    title: 'Breaking: Tech Conference Unveils New AI Innovations',
    summary: 'Live coverage of the annual tech conference featuring the latest developments in artificial intelligence and machine learning.',
    location: 'San Francisco',
    author: 'Michael Chen',
    authorImage: 'https://randomuser.me/api/portraits/men/32.jpg',
    isLive: true,
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    publishedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    likes: 245,
    views: 1200,
    commentsCount: 58
  },
  { 
    id: 2, 
    title: 'City Council Votes on New Environmental Regulations',
    summary: 'The city council is meeting to discuss and vote on proposed environmental regulations aimed at reducing carbon emissions.',
    location: 'Chicago',
    author: 'Sarah Johnson',
    authorImage: 'https://randomuser.me/api/portraits/women/44.jpg',
    isLive: true,
    thumbnail: 'https://images.unsplash.com/photo-1577130330204-1e1f88c87f6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    publishedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    likes: 132,
    views: 890,
    commentsCount: 37
  },
  { 
    id: 3, 
    title: 'Music Festival Kicks Off with Record Attendance',
    summary: 'The annual summer music festival has begun with a record number of attendees from around the world.',
    location: 'Austin',
    author: 'David Wilson',
    authorImage: 'https://randomuser.me/api/portraits/men/67.jpg',
    isLive: true,
    thumbnail: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    likes: 378,
    views: 1500,
    commentsCount: 92
  }
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

// Root path serves a simple page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>NewsGeo Mobile App</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          
          header {
            background-color: #0f172a;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          
          h1 {
            margin-top: 0;
          }
          
          .card {
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            margin-bottom: 20px;
          }
          
          .card-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
          }
          
          .card-content {
            padding: 20px;
          }
          
          .card-meta {
            display: flex;
            justify-content: space-between;
            color: #64748b;
            font-size: 14px;
            margin-bottom: 10px;
          }
          
          .card-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .card-summary {
            color: #64748b;
            margin-bottom: 15px;
          }
          
          .card-footer {
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #f1f5f9;
            padding-top: 15px;
            font-size: 14px;
            color: #64748b;
          }
          
          .card-author {
            display: flex;
            align-items: center;
          }
          
          .author-image {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            margin-right: 10px;
          }
          
          .live-badge {
            background-color: #f97316;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            position: absolute;
            top: 10px;
            left: 10px;
          }
          
          .message {
            text-align: center;
            padding: 40px;
            background-color: #f8fafc;
            border-radius: 8px;
          }
          
          .image-container {
            position: relative;
          }
          
          button {
            background-color: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          }
          
          button:hover {
            background-color: #1d4ed8;
          }
          
          footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <header>
          <h1>NewsGeo Mobile App</h1>
          <p>Your hyper-local news streaming platform</p>
        </header>
        
        <main>
          <div class="message">
            <h2>Modern Mobile News App</h2>
            <p>This is the web preview of our mobile app interface. The React Native app provides a rich, native experience on mobile devices.</p>
            <p>The home page displays live and video content with a modern UI, where non-logged-in users can access up to 10 news items.</p>
            <button onclick="loadNews()">View Sample News</button>
          </div>
          
          <div id="news-container" style="margin-top: 30px;"></div>
        </main>
        
        <footer>
          <p>&copy; 2025 NewsGeo - All rights reserved</p>
        </footer>
        
        <script>
          async function loadNews() {
            try {
              const response = await fetch('/api/news');
              const news = await response.json();
              
              const container = document.getElementById('news-container');
              container.innerHTML = ''; // Clear container
              
              news.forEach(item => {
                const date = new Date(item.publishedAt);
                const timeAgo = getTimeAgo(date);
                
                const card = document.createElement('div');
                card.className = 'card';
                
                card.innerHTML = \`
                  <div class="image-container">
                    <img src="\${item.thumbnail}" alt="\${item.title}" class="card-image">
                    \${item.isLive ? '<div class="live-badge">LIVE</div>' : ''}
                  </div>
                  <div class="card-content">
                    <div class="card-meta">
                      <div>\${item.location}</div>
                      <div>\${timeAgo}</div>
                    </div>
                    <h3 class="card-title">\${item.title}</h3>
                    <p class="card-summary">\${item.summary}</p>
                    <div class="card-footer">
                      <div class="card-author">
                        <img src="\${item.authorImage}" alt="\${item.author}" class="author-image">
                        <span>\${item.author}</span>
                      </div>
                      <div>
                        \${item.likes} likes • \${item.commentsCount} comments
                      </div>
                    </div>
                  </div>
                \`;
                
                container.appendChild(card);
              });
            } catch (error) {
              console.error('Error loading news:', error);
              document.getElementById('news-container').innerHTML = 
                '<div class="message"><p>Error loading news. Please try again later.</p></div>';
            }
          }
          
          function getTimeAgo(date) {
            const seconds = Math.floor((new Date() - date) / 1000);
            
            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + ' years ago';
            
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + ' months ago';
            
            interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) + ' days ago';
            
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + ' hours ago';
            
            interval = seconds / 60;
            if (interval > 1) return Math.floor(interval) + ' minutes ago';
            
            return 'Just now';
          }
        </script>
      </body>
    </html>
  `);
});

// Start the server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`React Native Client Server is running on http://0.0.0.0:${PORT}`);
  console.log(`Mobile WebSocket endpoint available at ws://0.0.0.0:${PORT}/mobile-ws`);
  console.log('========================================');
  console.log('Ready to serve web requests and mobile connections');
  console.log('========================================');
});