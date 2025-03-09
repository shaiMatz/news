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
        <title>NewsGeo - Modern Mobile News App</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --primary: #2563eb;
            --primary-dark: #1d4ed8;
            --secondary: #f97316;
            --bg-light: #f8fafc;
            --bg-dark: #0f172a;
            --text-light: #64748b;
            --text-dark: #1e293b;
            --card-bg: #ffffff;
            --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
            --border-radius: 0.75rem;
            --transition: all 0.3s ease;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--bg-light);
            color: var(--text-dark);
            line-height: 1.5;
          }
          
          #root {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }
          
          header {
            background-color: var(--bg-dark);
            color: white;
            padding: 1rem;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 1rem;
            width: 100%;
          }
          
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .logo {
            font-size: 1.5rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .logo-icon {
            color: var(--secondary);
          }
          
          .header-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
          }
          
          main {
            flex: 1;
          }
          
          .tab-bar {
            background-color: white;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            padding: 0.5rem 0;
            overflow-x: auto;
            white-space: nowrap;
            position: sticky;
            top: 64px; /* Header height */
            z-index: 99;
          }
          
          .tabs {
            display: flex;
            gap: 1rem;
            padding: 0 1rem;
          }
          
          .tab {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-weight: 500;
            cursor: pointer;
            font-size: 0.875rem;
          }
          
          .tab.active {
            background-color: rgba(37, 99, 235, 0.1);
            color: var(--primary);
          }
          
          .featured {
            position: relative;
            height: 240px;
            margin: 1rem 0;
            border-radius: var(--border-radius);
            overflow: hidden;
          }
          
          .featured-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .featured-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.8));
            padding: 1rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          
          .featured-badges {
            display: flex;
            justify-content: space-between;
          }
          
          .live-badge {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            background-color: var(--secondary);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.75rem;
            color: white;
          }
          
          .live-indicator {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: white;
          }
          
          .location-badge {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            background-color: rgba(0, 0, 0, 0.5);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            color: white;
          }
          
          .featured-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: white;
            margin-bottom: 0.5rem;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
          }
          
          .featured-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .author {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .author-image {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 0.75rem;
          }
          
          .author-name {
            font-size: 0.875rem;
            color: white;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
          }
          
          .featured-time {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.8);
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
          }
          
          .play-button {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          
          .live-stories {
            padding: 1rem 0;
          }
          
          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
            padding: 0 1rem;
          }
          
          .section-title {
            font-size: 1.125rem;
            font-weight: 600;
          }
          
          .see-all {
            color: var(--primary);
            font-size: 0.875rem;
            font-weight: 500;
          }
          
          .stories-container {
            display: flex;
            gap: 1rem;
            overflow-x: auto;
            padding: 0 1rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .stories-container::-webkit-scrollbar {
            display: none;
          }
          
          .story {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            width: 72px;
          }
          
          .story-avatar {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            border: 2px solid var(--secondary);
            position: relative;
          }
          
          .story-image {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
          }
          
          .story-indicator {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: var(--secondary);
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .story-indicator-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: white;
          }
          
          .story-name {
            font-size: 0.75rem;
            text-align: center;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            max-width: 90px;
          }
          
          .news-list {
            padding: 1rem;
          }
          
          .news-card {
            background-color: white;
            border-radius: var(--border-radius);
            overflow: hidden;
            box-shadow: var(--card-shadow);
            margin-bottom: 1rem;
            display: flex;
            flex-direction: column;
          }
          
          .news-image-container {
            height: 180px;
            position: relative;
          }
          
          .news-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .live-tag {
            position: absolute;
            top: 0.5rem;
            left: 0.5rem;
            background-color: var(--secondary);
            color: white;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }
          
          .news-content {
            padding: 1rem;
          }
          
          .news-meta {
            display: flex;
            justify-content: space-between;
            font-size: 0.75rem;
            color: var(--text-light);
            margin-bottom: 0.5rem;
          }
          
          .news-location {
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }
          
          .news-title {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            line-height: 1.4;
          }
          
          .news-excerpt {
            font-size: 0.875rem;
            color: var(--text-light);
            margin-bottom: 1rem;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .news-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 0.5rem;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
          }
          
          .news-author {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.75rem;
          }
          
          .news-author-image {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: var(--text-light);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.625rem;
          }
          
          .news-stats {
            display: flex;
            gap: 0.75rem;
            font-size: 0.75rem;
            color: var(--text-light);
          }
          
          .stat-item {
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }
          
          .premium-banner {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: white;
            padding: 1rem;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .premium-text {
            font-size: 0.875rem;
            font-weight: 500;
          }
          
          .sign-in-button {
            background-color: var(--primary);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-weight: 500;
            font-size: 0.875rem;
            border: none;
            cursor: pointer;
          }
          
          footer {
            padding: 2rem 1rem;
            background-color: var(--bg-dark);
            color: white;
            text-align: center;
            margin-top: 2rem;
          }
          
          .icon {
            display: inline-block;
            width: 1em;
            height: 1em;
            stroke-width: 0;
            stroke: currentColor;
            fill: currentColor;
            vertical-align: -0.125em;
          }
          
          /* Dark mode toggle */
          .theme-toggle {
            width: 40px;
            height: 24px;
            border-radius: 12px;
            background-color: rgba(255, 255, 255, 0.1);
            position: relative;
            cursor: pointer;
          }
          
          .toggle-switch {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: white;
            position: absolute;
            top: 2px;
            left: 2px;
            transition: var(--transition);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            color: var(--text-dark);
          }
          
          .toggle-switch.dark {
            left: 18px;
            background-color: var(--bg-dark);
            color: white;
          }
        </style>
      </head>
      <body>
        <div id="root">
          <header>
            <div class="container">
              <div class="header-content">
                <div class="logo">
                  <svg class="icon logo-icon" viewBox="0 0 24 24">
                    <path d="M12 0C8.2 0 5 3.2 5 7c0 4.9 7 13 7 13s7-8.1 7-13c0-3.8-3.2-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 4.5 12 4.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"/>
                  </svg>
                  <span>NewsGeo</span>
                </div>
                
                <div class="header-actions">
                  <button class="sign-in-button">Sign In</button>
                  <div class="theme-toggle">
                    <div class="toggle-switch">
                      <svg class="icon" viewBox="0 0 24 24">
                        <path d="M12 9c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>
          
          <div class="tab-bar">
            <div class="container">
              <div class="tabs">
                <div class="tab active">
                  <svg class="icon" viewBox="0 0 24 24">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                  </svg>
                  All
                </div>
                <div class="tab">
                  <svg class="icon" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                  Live Now
                </div>
                <div class="tab">
                  <svg class="icon" viewBox="0 0 24 24">
                    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM12 5.5v9l6-4.5z"/>
                  </svg>
                  Videos
                </div>
                <div class="tab">
                  <svg class="icon" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                  Following
                </div>
                <div class="tab">
                  <svg class="icon" viewBox="0 0 24 24">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/>
                  </svg>
                  Trending
                </div>
              </div>
            </div>
          </div>
          
          <main>
            <div class="container">
              <!-- Featured content section -->
              <div class="featured">
                <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" class="featured-image" alt="Tech Conference">
                <div class="featured-overlay">
                  <div class="featured-badges">
                    <div class="live-badge">
                      <div class="live-indicator"></div>
                      LIVE
                    </div>
                    <div class="location-badge">
                      <svg class="icon" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      San Francisco
                    </div>
                  </div>
                  
                  <div>
                    <h3 class="featured-title">Breaking: Tech Conference Unveils New AI Innovations</h3>
                    <div class="featured-meta">
                      <div class="author">
                        <div class="author-image">MC</div>
                        <div class="author-name">Michael Chen</div>
                      </div>
                      <div class="featured-time">10 minutes ago</div>
                    </div>
                  </div>
                </div>
                
                <div class="play-button">
                  <svg class="icon" viewBox="0 0 24 24" style="width: 24px; height: 24px;">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              
              <!-- Live stories section -->
              <div class="live-stories">
                <div class="section-header">
                  <h2 class="section-title">Live Stories</h2>
                  <a href="#" class="see-all">See All</a>
                </div>
                
                <div class="stories-container">
                  <div class="story">
                    <div class="story-avatar">
                      <img src="https://randomuser.me/api/portraits/men/32.jpg" class="story-image" alt="Michael Chen">
                      <div class="story-indicator">
                        <div class="story-indicator-dot"></div>
                      </div>
                    </div>
                    <div class="story-name">Michael</div>
                  </div>
                  
                  <div class="story">
                    <div class="story-avatar">
                      <img src="https://randomuser.me/api/portraits/women/44.jpg" class="story-image" alt="Sarah Johnson">
                      <div class="story-indicator">
                        <div class="story-indicator-dot"></div>
                      </div>
                    </div>
                    <div class="story-name">Sarah</div>
                  </div>
                  
                  <div class="story">
                    <div class="story-avatar">
                      <img src="https://randomuser.me/api/portraits/men/67.jpg" class="story-image" alt="David Wilson">
                      <div class="story-indicator">
                        <div class="story-indicator-dot"></div>
                      </div>
                    </div>
                    <div class="story-name">David</div>
                  </div>
                  
                  <div class="story">
                    <div class="story-avatar">
                      <img src="https://randomuser.me/api/portraits/women/63.jpg" class="story-image" alt="Jennifer Lopez">
                      <div class="story-indicator">
                        <div class="story-indicator-dot"></div>
                      </div>
                    </div>
                    <div class="story-name">Jennifer</div>
                  </div>
                  
                  <div class="story">
                    <div class="story-avatar">
                      <img src="https://randomuser.me/api/portraits/men/41.jpg" class="story-image" alt="Thomas Reed">
                      <div class="story-indicator">
                        <div class="story-indicator-dot"></div>
                      </div>
                    </div>
                    <div class="story-name">Thomas</div>
                  </div>
                  
                  <div class="story">
                    <div class="story-avatar">
                      <img src="https://randomuser.me/api/portraits/women/33.jpg" class="story-image" alt="Emma Rodriguez">
                      <div class="story-indicator">
                        <div class="story-indicator-dot"></div>
                      </div>
                    </div>
                    <div class="story-name">Emma</div>
                  </div>
                </div>
              </div>
              
              <!-- News feed section -->
              <div class="news-list">
                <div class="section-header" style="padding: 0;">
                  <h2 class="section-title">Latest News</h2>
                  <a href="#" class="see-all">View All</a>
                </div>
                
                <!-- News Card 1: Live -->
                <div class="news-card">
                  <div class="news-image-container">
                    <img src="https://images.unsplash.com/photo-1577130330204-1e1f88c87f6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" class="news-image" alt="City Council Meeting">
                    <div class="live-tag">
                      <div class="live-indicator"></div>
                      LIVE
                    </div>
                  </div>
                  <div class="news-content">
                    <div class="news-meta">
                      <div class="news-location">
                        <svg class="icon" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        Chicago
                      </div>
                      <div>25 minutes ago</div>
                    </div>
                    <h3 class="news-title">City Council Votes on New Environmental Regulations</h3>
                    <p class="news-excerpt">The city council is meeting to discuss and vote on proposed environmental regulations aimed at reducing carbon emissions.</p>
                    <div class="news-footer">
                      <div class="news-author">
                        <div class="news-author-image">SJ</div>
                        <div>Sarah Johnson</div>
                      </div>
                      <div class="news-stats">
                        <div class="stat-item">
                          <svg class="icon" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          132
                        </div>
                        <div class="stat-item">
                          <svg class="icon" viewBox="0 0 24 24">
                            <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                          </svg>
                          37
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- News Card 2: Video -->
                <div class="news-card">
                  <div class="news-image-container">
                    <img src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" class="news-image" alt="Music Festival">
                  </div>
                  <div class="news-content">
                    <div class="news-meta">
                      <div class="news-location">
                        <svg class="icon" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        Austin
                      </div>
                      <div>1 hour ago</div>
                    </div>
                    <h3 class="news-title">Music Festival Kicks Off with Record Attendance</h3>
                    <p class="news-excerpt">The annual summer music festival has begun with a record number of attendees from around the world.</p>
                    <div class="news-footer">
                      <div class="news-author">
                        <div class="news-author-image">DW</div>
                        <div>David Wilson</div>
                      </div>
                      <div class="news-stats">
                        <div class="stat-item">
                          <svg class="icon" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          378
                        </div>
                        <div class="stat-item">
                          <svg class="icon" viewBox="0 0 24 24">
                            <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                          </svg>
                          92
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- News Card 3: Live -->
                <div class="news-card">
                  <div class="news-image-container">
                    <img src="https://images.unsplash.com/photo-1574012659361-485ee3fba3fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" class="news-image" alt="Sports Championship">
                    <div class="live-tag">
                      <div class="live-indicator"></div>
                      LIVE
                    </div>
                  </div>
                  <div class="news-content">
                    <div class="news-meta">
                      <div class="news-location">
                        <svg class="icon" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        Miami
                      </div>
                      <div>Just now</div>
                    </div>
                    <h3 class="news-title">Sports Championship Final Match Underway</h3>
                    <p class="news-excerpt">Live coverage of the championship final match that will determine this season's ultimate winner.</p>
                    <div class="news-footer">
                      <div class="news-author">
                        <div class="news-author-image">JL</div>
                        <div>Jennifer Lopez</div>
                      </div>
                      <div class="news-stats">
                        <div class="stat-item">
                          <svg class="icon" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          412
                        </div>
                        <div class="stat-item">
                          <svg class="icon" viewBox="0 0 24 24">
                            <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                          </svg>
                          127
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- News Card 4 -->
                <div class="news-card">
                  <div class="news-image-container">
                    <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" class="news-image" alt="Local Startup">
                  </div>
                  <div class="news-content">
                    <div class="news-meta">
                      <div class="news-location">
                        <svg class="icon" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        Boston
                      </div>
                      <div>3 hours ago</div>
                    </div>
                    <h3 class="news-title">Local Startup Receives Major Investment</h3>
                    <p class="news-excerpt">A promising local tech startup has secured $10 million in Series A funding to expand operations and develop new products.</p>
                    <div class="news-footer">
                      <div class="news-author">
                        <div class="news-author-image">TR</div>
                        <div>Thomas Reed</div>
                      </div>
                      <div class="news-stats">
                        <div class="stat-item">
                          <svg class="icon" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          89
                        </div>
                        <div class="stat-item">
                          <svg class="icon" viewBox="0 0 24 24">
                            <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                          </svg>
                          14
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Premium freemium banner at the 5th item -->
                <div class="premium-banner">
                  <div class="premium-text">Sign in to see more content</div>
                  <button class="sign-in-button">Sign In</button>
                </div>
              </div>
            </div>
          </main>
          
          <footer>
            <div class="container">
              <p>&copy; 2025 NewsGeo - Your location-based news platform</p>
            </div>
          </footer>
        </div>
        
        <script>
          // Toggle dark mode
          document.querySelector('.theme-toggle').addEventListener('click', function() {
            const toggleSwitch = this.querySelector('.toggle-switch');
            toggleSwitch.classList.toggle('dark');
            
            // Implement dark mode switching here
            document.body.classList.toggle('dark-mode');
          });
          
          // Tab switching
          document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
              document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
              this.classList.add('active');
              
              // Implement content switching here
              console.log('Switched to tab:', this.textContent.trim());
            });
          });
          
          // Sign in button
          document.querySelectorAll('.sign-in-button').forEach(button => {
            button.addEventListener('click', function() {
              alert('Sign in functionality will be implemented in the mobile app');
            });
          });
          
          // Simulate server connection
          fetch('/api/news')
            .then(response => response.json())
            .then(data => {
              console.log('Connected to server successfully');
              console.log('News data:', data);
            })
            .catch(error => {
              console.error('Error connecting to server:', error);
            });
        </script>
      </body>
    </html>
  `);
});
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