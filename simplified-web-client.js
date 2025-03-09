const express = require('express');
const app = express();
const port = 5001;
const path = require('path');
const fetch = require('node-fetch');

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS to allow cross-origin requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Root endpoint - modern home page with live content display
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NewsGeo - Live News Around You</title>
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
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
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
        
        .nav-links {
          display: flex;
          gap: 1.5rem;
        }

        .nav-links a {
          color: white;
          text-decoration: none;
          font-weight: 500;
          opacity: 0.8;
          transition: var(--transition);
        }

        .nav-links a:hover {
          opacity: 1;
        }

        .auth-buttons {
          display: flex;
          gap: 1rem;
        }

        .btn {
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
          border: none;
          font-size: 0.875rem;
        }

        .btn-outline {
          background: transparent;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .btn-outline:hover {
          border-color: white;
        }

        .btn-primary {
          background-color: var(--primary);
          color: white;
        }

        .btn-primary:hover {
          background-color: var(--primary-dark);
        }

        .hero {
          padding: 3rem 0;
          background-image: linear-gradient(to bottom, #0f172a, rgba(15, 23, 42, 0.95));
          color: white;
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          background-image: url('https://images.unsplash.com/photo-1557683325-3ba8f0df79de?q=80&w=2029&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
          background-size: cover;
          background-position: center;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          opacity: 0.2;
          z-index: 0;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }

        .hero h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .hero p {
          font-size: 1.125rem;
          opacity: 0.8;
          margin-bottom: 1.5rem;
          max-width: 600px;
        }

        .search-bar {
          display: flex;
          width: 100%;
          max-width: 600px;
          background: white;
          border-radius: var(--border-radius);
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .search-bar input {
          flex: 1;
          padding: 1rem;
          border: none;
          font-size: 1rem;
        }

        .search-bar button {
          background-color: var(--primary);
          color: white;
          border: none;
          padding: 0 1.5rem;
          cursor: pointer;
          font-weight: 500;
        }

        .location-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: rgba(255, 255, 255, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .main-content {
          padding: 2rem 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-dark);
        }

        .section-link {
          color: var(--primary);
          text-decoration: none;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .news-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .news-card {
          background-color: var(--card-bg);
          border-radius: var(--border-radius);
          overflow: hidden;
          box-shadow: var(--card-shadow);
          transition: var(--transition);
          cursor: pointer;
        }

        .news-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
        }

        .news-card-image {
          height: 180px;
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .news-card.live .news-card-image::before {
          content: 'LIVE';
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          background-color: var(--secondary);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .news-card-content {
          padding: 1rem;
        }

        .news-card-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-light);
        }

        .news-card-location {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .news-card-title {
          font-weight: 600;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .news-card-excerpt {
          font-size: 0.875rem;
          color: var(--text-light);
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .news-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          font-size: 0.75rem;
        }

        .news-card-author {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .author-avatar {
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 9999px;
          background-size: cover;
          background-position: center;
        }

        .news-card-stats {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-light);
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .trending-container {
          background-color: var(--bg-dark);
          color: white;
          padding: 2.5rem 0;
          margin-bottom: 3rem;
        }

        .trending-header {
          margin-bottom: 1.5rem;
        }

        .trending-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: white;
        }

        .trending-subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1rem;
          margin-top: 0.5rem;
        }

        .trending-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .trending-card {
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: var(--border-radius);
          padding: 1.25rem;
          transition: var(--transition);
        }

        .trending-card:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .trending-rank {
          font-size: 2rem;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 0.5rem;
        }

        .trending-card-title {
          font-size: 1rem;
          font-weight: 500;
          line-height: 1.4;
          margin-bottom: 0.5rem;
        }

        .trending-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .premium-banner {
          background-color: white;
          border-radius: var(--border-radius);
          padding: 2rem;
          box-shadow: var(--card-shadow);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 3rem;
        }

        .premium-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--text-dark);
        }

        .premium-description {
          font-size: 1rem;
          margin-bottom: 1.5rem;
          max-width: 600px;
          color: var(--text-light);
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          
          .hero h1 {
            font-size: 2rem;
          }
          
          .news-grid, .trending-cards {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .auth-buttons {
            display: none;
          }
          
          .hero h1 {
            font-size: 1.75rem;
          }
          
          .section-title {
            font-size: 1.25rem;
          }
        }

        /* Icons */
        .icon {
          display: inline-block;
          width: 1em;
          height: 1em;
          stroke-width: 0;
          stroke: currentColor;
          fill: currentColor;
          vertical-align: -0.125em;
        }
      </style>
    </head>
    <body>
      <header>
        <div class="container">
          <div class="header-content">
            <div class="logo">
              <svg class="icon logo-icon" viewBox="0 0 24 24">
                <path d="M12 0C8.2 0 5 3.2 5 7c0 4.9 7 13 7 13s7-8.1 7-13c0-3.8-3.2-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 4.5 12 4.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"/>
              </svg>
              <span>NewsGeo</span>
            </div>
            <nav class="nav-links">
              <a href="#">Home</a>
              <a href="#">Live Now</a>
              <a href="#">Trending</a>
              <a href="#">Categories</a>
              <a href="#">About</a>
            </nav>
            <div class="auth-buttons">
              <button class="btn btn-outline">Log in</button>
              <button class="btn btn-primary">Sign up</button>
            </div>
          </div>
        </div>
      </header>

      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <h1>Discover the world through local eyes</h1>
            <p>Stay informed with the latest news and live streams happening around you and across the globe.</p>
            <div class="search-bar">
              <input type="text" placeholder="Search for news, topics, or locations...">
              <button>
                <svg class="icon" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </button>
            </div>
            <div class="location-badge">
              <svg class="icon" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>San Francisco, CA</span>
            </div>
          </div>
        </div>
      </section>

      <main class="main-content">
        <div class="container">
          <!-- Live Now Section -->
          <div class="section-header">
            <h2 class="section-title">Live Now</h2>
            <a href="#" class="section-link">
              View all
              <svg class="icon" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </a>
          </div>
          
          <div class="news-grid" id="liveNewsGrid">
            <!-- Live news cards will be loaded here -->
          </div>

          <!-- Trending Section -->
          <div class="trending-container">
            <div class="container">
              <div class="trending-header">
                <h2 class="trending-title">Trending News</h2>
                <p class="trending-subtitle">What people are following right now</p>
              </div>
              
              <div class="trending-cards" id="trendingCards">
                <!-- Trending news cards will be loaded here -->
              </div>
            </div>
          </div>

          <!-- Recent News Section -->
          <div class="section-header">
            <h2 class="section-title">Recent News</h2>
            <a href="#" class="section-link">
              View all
              <svg class="icon" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </a>
          </div>
          
          <div class="news-grid" id="recentNewsGrid">
            <!-- Recent news cards will be loaded here -->
          </div>

          <!-- Premium Banner -->
          <div class="premium-banner">
            <h3 class="premium-title">Get unlimited access to all content</h3>
            <p class="premium-description">Sign up to unlock all features including unlimited news, live streams, interactive maps, and personalized notifications.</p>
            <button class="btn btn-primary">Sign up for free</button>
          </div>
        </div>
      </main>
      
      <script>
        // Sample data for live news
        const liveNewsData = [
          {
            id: 1,
            title: "Breaking: Tech Conference Unveils New AI Innovations",
            excerpt: "Live coverage of the annual tech conference featuring the latest developments in artificial intelligence and machine learning.",
            image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
            author: "Michael Chen",
            authorImage: "https://randomuser.me/api/portraits/men/32.jpg",
            location: "San Francisco",
            time: "10 minutes ago",
            likes: 245,
            comments: 58,
            isLive: true
          },
          {
            id: 2,
            title: "City Council Votes on New Environmental Regulations",
            excerpt: "The city council is meeting to discuss and vote on proposed environmental regulations aimed at reducing carbon emissions.",
            image: "https://images.unsplash.com/photo-1577130330204-1e1f88c87f6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
            author: "Sarah Johnson",
            authorImage: "https://randomuser.me/api/portraits/women/44.jpg",
            location: "Chicago",
            time: "25 minutes ago",
            likes: 132,
            comments: 37,
            isLive: true
          },
          {
            id: 3,
            title: "Music Festival Kicks Off with Record Attendance",
            excerpt: "The annual summer music festival has begun with a record number of attendees from around the world.",
            image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
            author: "David Wilson",
            authorImage: "https://randomuser.me/api/portraits/men/67.jpg",
            location: "Austin",
            time: "1 hour ago",
            likes: 378,
            comments: 92,
            isLive: true
          },
          {
            id: 4,
            title: "Sports Championship Final Match Underway",
            excerpt: "Live coverage of the championship final match that will determine this season's ultimate winner.",
            image: "https://images.unsplash.com/photo-1574012659361-485ee3fba3fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80", 
            author: "Jennifer Lopez",
            authorImage: "https://randomuser.me/api/portraits/women/63.jpg",
            location: "Miami",
            time: "Just now",
            likes: 412,
            comments: 127,
            isLive: true
          }
        ];
        
        // Sample data for trending news
        const trendingNewsData = [
          {
            id: 1,
            title: "New Study Reveals Impact of Climate Change on Coastal Cities",
            location: "Global",
            time: "3 hours ago",
            views: "124K"
          },
          {
            id: 2,
            title: "Tech Giant Announces Revolutionary New Product Line",
            location: "Silicon Valley",
            time: "5 hours ago",
            views: "98K"
          },
          {
            id: 3,
            title: "Major Healthcare Breakthrough Could Transform Treatment Options",
            location: "Boston",
            time: "7 hours ago",
            views: "87K"
          },
          {
            id: 4,
            title: "International Summit Reaches Historic Agreement",
            location: "Geneva",
            time: "9 hours ago",
            views: "76K"
          }
        ];
        
        // Sample data for recent news
        const recentNewsData = [
          {
            id: 5,
            title: "Local Startup Receives Major Investment",
            excerpt: "A promising local tech startup has secured $10 million in Series A funding to expand operations and develop new products.",
            image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
            author: "Thomas Reed",
            authorImage: "https://randomuser.me/api/portraits/men/41.jpg",
            location: "Boston",
            time: "3 hours ago",
            likes: 89,
            comments: 14,
            isLive: false
          },
          {
            id: 6,
            title: "New Restaurant Opens with Innovative Dining Concept",
            excerpt: "A new restaurant featuring a unique farm-to-table approach and interactive dining experience has opened downtown.",
            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
            author: "Emma Rodriguez",
            authorImage: "https://randomuser.me/api/portraits/women/33.jpg",
            location: "New York",
            time: "5 hours ago",
            likes: 156,
            comments: 23,
            isLive: false
          },
          {
            id: 7,
            title: "Art Exhibition Showcases Emerging Local Talent",
            excerpt: "A new art exhibition featuring works by emerging local artists has opened at the downtown gallery and is drawing large crowds.",
            image: "https://images.unsplash.com/photo-1515169067868-5387ec356754?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
            author: "Olivia Kim",
            authorImage: "https://randomuser.me/api/portraits/women/29.jpg",
            location: "Portland",
            time: "7 hours ago",
            likes: 78,
            comments: 9,
            isLive: false
          },
          {
            id: 8,
            title: "City Announces New Public Transportation Initiative",
            excerpt: "The city has announced a new initiative to expand public transportation options and improve accessibility for residents.",
            image: "https://images.unsplash.com/photo-1519498955859-58a7f26cf0d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
            author: "Carlos Mendez",
            authorImage: "https://randomuser.me/api/portraits/men/55.jpg",
            location: "Chicago",
            time: "9 hours ago",
            likes: 112,
            comments: 31,
            isLive: false
          },
          {
            id: 9,
            title: "Educational Program Expands to Serve More Students",
            excerpt: "A successful after-school educational program is expanding to serve more students in underrepresented communities.",
            image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
            author: "Maria Johnson",
            authorImage: "https://randomuser.me/api/portraits/women/85.jpg",
            location: "Atlanta",
            time: "11 hours ago",
            likes: 67,
            comments: 8,
            isLive: false
          },
          {
            id: 10,
            title: "Scientists Discover New Species in Remote Forest",
            excerpt: "Researchers have discovered a previously unknown species of wildlife in a remote forest region, highlighting the importance of conservation efforts.",
            image: "https://images.unsplash.com/photo-1551009175-15bdf9dcb580?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
            author: "Robert Chen",
            authorImage: "https://randomuser.me/api/portraits/men/22.jpg",
            location: "Seattle",
            time: "Yesterday",
            likes: 203,
            comments: 45,
            isLive: false
          }
        ];
        
        // Render live news cards
        function renderLiveNews() {
          const container = document.getElementById('liveNewsGrid');
          
          liveNewsData.forEach(news => {
            container.innerHTML += \`
              <div class="news-card \${news.isLive ? 'live' : ''}">
                <div class="news-card-image" style="background-image: url('\${news.image}')"></div>
                <div class="news-card-content">
                  <div class="news-card-meta">
                    <div class="news-card-location">
                      <svg class="icon" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span>\${news.location}</span>
                    </div>
                    <span>\${news.time}</span>
                  </div>
                  <h3 class="news-card-title">\${news.title}</h3>
                  <p class="news-card-excerpt">\${news.excerpt}</p>
                  <div class="news-card-footer">
                    <div class="news-card-author">
                      <div class="author-avatar" style="background-image: url('\${news.authorImage}')"></div>
                      <span>\${news.author}</span>
                    </div>
                    <div class="news-card-stats">
                      <div class="stat">
                        <svg class="icon" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <span>\${news.likes}</span>
                      </div>
                      <div class="stat">
                        <svg class="icon" viewBox="0 0 24 24">
                          <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                        </svg>
                        <span>\${news.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            \`;
          });
        }
        
        // Render trending news cards
        function renderTrendingNews() {
          const container = document.getElementById('trendingCards');
          
          trendingNewsData.forEach((news, index) => {
            container.innerHTML += \`
              <div class="trending-card">
                <div class="trending-rank">#\${index + 1}</div>
                <h3 class="trending-card-title">\${news.title}</h3>
                <div class="trending-meta">
                  <div class="trending-location">
                    <svg class="icon" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    \${news.location}
                  </div>
                  <div class="trending-views">\${news.views} views</div>
                </div>
              </div>
            \`;
          });
        }
        
        // Render recent news cards
        function renderRecentNews() {
          const container = document.getElementById('recentNewsGrid');
          
          recentNewsData.forEach(news => {
            container.innerHTML += \`
              <div class="news-card \${news.isLive ? 'live' : ''}">
                <div class="news-card-image" style="background-image: url('\${news.image}')"></div>
                <div class="news-card-content">
                  <div class="news-card-meta">
                    <div class="news-card-location">
                      <svg class="icon" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span>\${news.location}</span>
                    </div>
                    <span>\${news.time}</span>
                  </div>
                  <h3 class="news-card-title">\${news.title}</h3>
                  <p class="news-card-excerpt">\${news.excerpt}</p>
                  <div class="news-card-footer">
                    <div class="news-card-author">
                      <div class="author-avatar" style="background-image: url('\${news.authorImage}')"></div>
                      <span>\${news.author}</span>
                    </div>
                    <div class="news-card-stats">
                      <div class="stat">
                        <svg class="icon" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <span>\${news.likes}</span>
                      </div>
                      <div class="stat">
                        <svg class="icon" viewBox="0 0 24 24">
                          <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                        </svg>
                        <span>\${news.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            \`;
          });
        }
        
        // Initialize the page
        document.addEventListener('DOMContentLoaded', () => {
          renderLiveNews();
          renderTrendingNews();
          renderRecentNews();
          
          // Set up the login button
          document.querySelectorAll('.btn-outline').forEach(button => {
            button.addEventListener('click', () => {
              window.location.href = '/login';
            });
          });
          
          // Set up the signup button
          document.querySelectorAll('.btn-primary').forEach(button => {
            button.addEventListener('click', () => {
              window.location.href = '/register';
            });
          });
        });
        
        // Check server status
        fetch('/api/check')
          .then(response => response.json())
          .then(data => {
            console.log('Server status:', data);
          })
          .catch(error => {
            console.error('Error checking server status:', error);
          });
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