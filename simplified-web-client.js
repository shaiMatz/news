const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create a welcome page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>NewsGeo Platform</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body, html {
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #f0f2f5;
            color: #333;
            line-height: 1.5;
          }
          .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 1rem;
          }
          header {
            background-color: #2c3e50;
            color: white;
            padding: 1.5rem 0;
            margin-bottom: 2rem;
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo {
            font-size: 1.75rem;
            font-weight: 700;
          }
          .nav-links {
            display: flex;
            gap: 1.5rem;
          }
          .nav-link {
            color: white;
            text-decoration: none;
            font-weight: 500;
          }
          .card {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 1.5rem;
            margin-bottom: 2rem;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
          }
          .button {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: background-color 0.3s;
          }
          .button:hover {
            background-color: #2980b9;
          }
          .button-secondary {
            background-color: #2ecc71;
          }
          .button-secondary:hover {
            background-color: #27ae60;
          }
          h1, h2, h3 {
            margin-top: 0;
          }
          footer {
            text-align: center;
            padding: 2rem 0;
            color: #7f8c8d;
            font-size: 0.9rem;
          }
          .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 0.5rem;
          }
          .status-online {
            background-color: #2ecc71;
          }
          .status-offline {
            background-color: #e74c3c;
          }
          .feature-list {
            list-style-type: none;
            padding: 0;
          }
          .feature-list li {
            margin-bottom: 0.75rem;
            padding-left: 1.5rem;
            position: relative;
          }
          .feature-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #2ecc71;
          }
          .status-card {
            padding: 1rem;
            border: 1px solid #ddd;
            border-radius: 6px;
            margin-bottom: 1rem;
          }
          
          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #1a1a1a;
              color: #f5f5f5;
            }
            .card {
              background-color: #2d2d2d;
            }
            .status-card {
              border-color: #444;
            }
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .header-content {
              flex-direction: column;
              gap: 1rem;
              text-align: center;
            }
            .nav-links {
              justify-content: center;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <div class="container">
            <div class="header-content">
              <div class="logo">NewsGeo</div>
              <nav class="nav-links">
                <a href="/" class="nav-link">Home</a>
                <a href="/auth" class="nav-link">Login/Register</a>
                <a href="/dashboard" class="nav-link">Dashboard</a>
                <a href="/about" class="nav-link">About</a>
              </nav>
            </div>
          </div>
        </header>
        
        <main class="container">
          <section class="card">
            <h1>Welcome to NewsGeo Platform</h1>
            <p>NewsGeo is a cutting-edge news streaming platform that delivers hyper-local, personalized content with advanced real-time capabilities and intelligent user engagement.</p>
            <div style="margin-top: 1.5rem;">
              <a href="/auth" class="button">Get Started</a>
              <a href="/docs" class="button button-secondary" style="margin-left: 1rem;">Learn More</a>
            </div>
          </section>

          <section class="grid">
            <div class="card">
              <h2>Key Features</h2>
              <ul class="feature-list">
                <li>Hyper-local news based on your location</li>
                <li>Real-time updates via WebSockets</li>
                <li>Cross-platform support (web and mobile)</li>
                <li>Personalized content delivery</li>
                <li>Social sharing and engagement</li>
                <li>Advanced notification system</li>
              </ul>
            </div>
            
            <div class="card">
              <h2>System Status</h2>
              <div class="status-card">
                <p>
                  <span class="status-indicator status-online"></span>
                  <strong>Main Server:</strong> Online
                </p>
                <small>Core API server handling authentication and data</small>
              </div>
              
              <div class="status-card">
                <p>
                  <span class="status-indicator status-online"></span>
                  <strong>Web Client:</strong> Online
                </p>
                <small>Web interface for browsers</small>
              </div>
              
              <div class="status-card">
                <p>
                  <span class="status-indicator status-online"></span>
                  <strong>React Native Client:</strong> Online
                </p>
                <small>Mobile client interface</small>
              </div>
              
              <div id="api-status">
                <button id="check-api" class="button" style="margin-top: 1rem;">Check API Connection</button>
                <p id="api-result" style="margin-top: 0.5rem;"></p>
              </div>
            </div>
          </section>
          
          <section class="card">
            <h2>Getting Started</h2>
            <p>NewsGeo offers a freemium model where users can access 10 news items without logging in. For full access to all features including:</p>
            <ul class="feature-list">
              <li>Unlimited news access</li>
              <li>Content uploading</li>
              <li>Commenting and liking</li>
              <li>Following other users</li>
              <li>Real-time notifications</li>
            </ul>
            <p>Create a free account to unlock all features!</p>
            <a href="/auth" class="button" style="margin-top: 1rem;">Create Account</a>
          </section>
        </main>
        
        <footer>
          <div class="container">
            <p>&copy; 2025 NewsGeo Platform. All rights reserved.</p>
          </div>
        </footer>
        
        <script>
          // API Status Check
          document.getElementById('check-api').addEventListener('click', function() {
            const apiResult = document.getElementById('api-result');
            apiResult.textContent = 'Checking API connection...';
            
            fetch('/api/test')
              .then(response => response.json())
              .then(data => {
                apiResult.textContent = 'Success! API is responding: ' + data.message;
                apiResult.style.color = '#2ecc71';
              })
              .catch(error => {
                apiResult.textContent = 'Error connecting to API: ' + error.message;
                apiResult.style.color = '#e74c3c';
              });
          });
        </script>
      </body>
    </html>
  `);
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is online',
    timestamp: new Date().toISOString()
  });
});

// Authentication page
app.get('/auth', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>NewsGeo - Authentication</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body, html {
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #f0f2f5;
            color: #333;
            line-height: 1.5;
            height: 100%;
          }
          .auth-container {
            min-height: 100vh;
            display: flex;
          }
          .auth-form-container {
            flex: 1;
            background-color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .auth-form {
            width: 100%;
            max-width: 400px;
          }
          .hero-section {
            flex: 1;
            background-color: #3498db;
            padding: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          .hero-content {
            max-width: 500px;
          }
          .hero-content h1 {
            font-size: 2.5rem;
            margin-bottom: 1.5rem;
          }
          .form-header {
            margin-bottom: 2rem;
            text-align: center;
          }
          .form-header h2 {
            font-size: 1.75rem;
            font-weight: 600;
            color: #333;
            margin: 0;
          }
          .form-group {
            margin-bottom: 1.5rem;
          }
          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
          }
          .form-control {
            width: 100%;
            padding: 0.75rem;
            font-size: 1rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            transition: border-color 0.3s;
          }
          .form-control:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
          }
          .btn {
            display: block;
            width: 100%;
            padding: 0.75rem;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.3s;
          }
          .btn:hover {
            background-color: #2980b9;
          }
          .form-footer {
            margin-top: 1.5rem;
            text-align: center;
          }
          .form-footer button {
            background: none;
            border: none;
            color: #3498db;
            cursor: pointer;
            font-size: 0.9rem;
          }
          .error-message {
            color: #e74c3c;
            margin-top: 1rem;
            text-align: center;
          }
          
          /* Logo section */
          .logo-section {
            text-align: center;
            margin-bottom: 2rem;
          }
          .logo {
            font-size: 1.5rem;
            font-weight: 700;
            color: #2c3e50;
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .auth-container {
              flex-direction: column;
            }
            .hero-section {
              display: none;
            }
          }
          
          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #1a1a1a;
              color: #f5f5f5;
            }
            .auth-form-container {
              background-color: #2d2d2d;
            }
            .form-control {
              background-color: #333;
              border-color: #444;
              color: #f5f5f5;
            }
            .form-header h2 {
              color: #f5f5f5;
            }
            .logo {
              color: #f5f5f5;
            }
          }
        </style>
      </head>
      <body>
        <div class="auth-container">
          <div class="auth-form-container">
            <div class="auth-form">
              <div class="logo-section">
                <div class="logo">NewsGeo</div>
                <p>Your personalized news platform</p>
              </div>
              
              <div class="form-header">
                <h2 id="auth-title">Login to Your Account</h2>
              </div>
              
              <form id="auth-form">
                <div class="form-group">
                  <label for="username">Username</label>
                  <input type="text" class="form-control" id="username" name="username" required>
                </div>
                
                <div class="form-group" id="email-field" style="display: none;">
                  <label for="email">Email</label>
                  <input type="email" class="form-control" id="email" name="email">
                </div>
                
                <div class="form-group">
                  <label for="password">Password</label>
                  <input type="password" class="form-control" id="password" name="password" required>
                </div>
                
                <button type="submit" class="btn" id="auth-button">Login</button>
              </form>
              
              <div class="error-message" id="error-message"></div>
              
              <div class="form-footer">
                <button type="button" id="toggle-auth">Need an account? Register</button>
              </div>
            </div>
          </div>
          
          <div class="hero-section">
            <div class="hero-content">
              <h1>NewsGeo</h1>
              <p>Your personalized news platform with location-based content delivery. Get the news that matters to you, when and where you need it.</p>
              <ul>
                <li>Hyper-local news based on your location</li>
                <li>Real-time breaking news updates</li>
                <li>Follow your favorite news sources</li>
                <li>Engage with your community</li>
              </ul>
            </div>
          </div>
        </div>
        
        <script>
          // Auth form toggle functionality
          let isLogin = true;
          const authForm = document.getElementById('auth-form');
          const toggleAuthButton = document.getElementById('toggle-auth');
          const authTitle = document.getElementById('auth-title');
          const authButton = document.getElementById('auth-button');
          const emailField = document.getElementById('email-field');
          const errorMessage = document.getElementById('error-message');
          
          toggleAuthButton.addEventListener('click', function() {
            isLogin = !isLogin;
            
            if (isLogin) {
              authTitle.textContent = 'Login to Your Account';
              authButton.textContent = 'Login';
              toggleAuthButton.textContent = 'Need an account? Register';
              emailField.style.display = 'none';
            } else {
              authTitle.textContent = 'Create New Account';
              authButton.textContent = 'Register';
              toggleAuthButton.textContent = 'Already have an account? Login';
              emailField.style.display = 'block';
            }
            
            errorMessage.textContent = '';
          });
          
          // Form submission
          authForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
              username: document.getElementById('username').value,
              password: document.getElementById('password').value
            };
            
            if (!isLogin) {
              formData.email = document.getElementById('email').value;
            }
            
            const endpoint = isLogin ? '/api/login' : '/api/register';
            
            // Simulate API call for demo purposes
            if (isLogin) {
              if (formData.username === 'demo' && formData.password === 'password') {
                window.location.href = '/dashboard';
              } else {
                errorMessage.textContent = 'Invalid username or password';
              }
            } else {
              // Registration success
              errorMessage.textContent = '';
              errorMessage.style.color = '#2ecc71';
              errorMessage.textContent = 'Registration successful! Redirecting to login...';
              
              setTimeout(() => {
                isLogin = true;
                authTitle.textContent = 'Login to Your Account';
                authButton.textContent = 'Login';
                toggleAuthButton.textContent = 'Need an account? Register';
                emailField.style.display = 'none';
                document.getElementById('username').value = formData.username;
                document.getElementById('password').value = '';
                errorMessage.textContent = '';
              }, 2000);
            }
          });
        </script>
      </body>
    </html>
  `);
});

// Dashboard page (protected in a real app)
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>NewsGeo - Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body, html {
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #f0f2f5;
            color: #333;
            line-height: 1.5;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem;
          }
          header {
            background-color: #2c3e50;
            color: white;
            padding: 1rem 0;
            margin-bottom: 2rem;
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo {
            font-size: 1.75rem;
            font-weight: 700;
          }
          .user-menu {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #3498db;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 500;
          }
          .button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
          }
          .button:hover {
            background-color: #2980b9;
          }
          .layout {
            display: grid;
            grid-template-columns: 250px 1fr;
            gap: 2rem;
          }
          .sidebar {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 1.5rem;
          }
          .main-content {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 1.5rem;
          }
          .nav-link {
            display: block;
            padding: 0.75rem 1rem;
            color: #333;
            text-decoration: none;
            border-radius: 4px;
            margin-bottom: 0.5rem;
          }
          .nav-link:hover {
            background-color: #f0f2f5;
          }
          .nav-link.active {
            background-color: #3498db;
            color: white;
          }
          .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
          }
          .news-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
          }
          .news-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
          }
          .news-image {
            height: 180px;
            background-color: #ddd;
            background-size: cover;
            background-position: center;
          }
          .news-content {
            padding: 1rem;
          }
          .news-title {
            margin-top: 0;
            margin-bottom: 0.5rem;
          }
          .news-meta {
            color: #7f8c8d;
            font-size: 0.9rem;
            display: flex;
            justify-content: space-between;
          }
          
          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #1a1a1a;
              color: #f5f5f5;
            }
            .sidebar, .main-content, .card, .news-card {
              background-color: #2d2d2d;
              border-color: #444;
            }
            .nav-link {
              color: #f5f5f5;
            }
            .nav-link:hover {
              background-color: #333;
            }
            .news-meta {
              color: #bbb;
            }
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .layout {
              grid-template-columns: 1fr;
            }
            .header-content {
              flex-direction: column;
              gap: 1rem;
            }
            .news-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <div class="container">
            <div class="header-content">
              <div class="logo">NewsGeo</div>
              <div class="user-menu">
                <div class="avatar">D</div>
                <span>Demo User</span>
                <button class="button" onclick="window.location.href='/'">Logout</button>
              </div>
            </div>
          </div>
        </header>
        
        <main class="container">
          <div class="layout">
            <aside class="sidebar">
              <nav>
                <a href="#" class="nav-link active">News Feed</a>
                <a href="#" class="nav-link">My Location</a>
                <a href="#" class="nav-link">Following</a>
                <a href="#" class="nav-link">Notifications</a>
                <a href="#" class="nav-link">Upload News</a>
                <a href="#" class="nav-link">Profile</a>
                <a href="#" class="nav-link">Settings</a>
              </nav>
            </aside>
            
            <div class="main-content">
              <h1>Your News Feed</h1>
              <p>Welcome back, Demo User! Here's the latest news based on your location and preferences.</p>
              
              <div class="card">
                <h3>Your Location</h3>
                <p id="location-display">Detecting your location...</p>
                <button id="update-location" class="button" style="margin-top: 0.5rem;">Update Location</button>
              </div>
              
              <div class="news-grid">
                <!-- News items would be dynamically generated in a real app -->
                <div class="news-card">
                  <div class="news-image" style="background-image: url('https://via.placeholder.com/300x180')"></div>
                  <div class="news-content">
                    <h3 class="news-title">Local Community Event This Weekend</h3>
                    <p>Join the community for a special gathering at the downtown park with live music and food...</p>
                    <div class="news-meta">
                      <span>Downtown</span>
                      <span>10 min ago</span>
                    </div>
                  </div>
                </div>
                
                <div class="news-card">
                  <div class="news-image" style="background-image: url('https://via.placeholder.com/300x180')"></div>
                  <div class="news-content">
                    <h3 class="news-title">Weather Alert: Storm System Approaching</h3>
                    <p>Meteorologists are tracking a storm system that is expected to bring heavy rain to the...</p>
                    <div class="news-meta">
                      <span>Regional</span>
                      <span>1 hour ago</span>
                    </div>
                  </div>
                </div>
                
                <div class="news-card">
                  <div class="news-image" style="background-image: url('https://via.placeholder.com/300x180')"></div>
                  <div class="news-content">
                    <h3 class="news-title">New Restaurant Opening Creates Buzz</h3>
                    <p>A new farm-to-table restaurant is opening in the Arts District next week, featuring...</p>
                    <div class="news-meta">
                      <span>Arts District</span>
                      <span>2 hours ago</span>
                    </div>
                  </div>
                </div>
                
                <div class="news-card">
                  <div class="news-image" style="background-image: url('https://via.placeholder.com/300x180')"></div>
                  <div class="news-content">
                    <h3 class="news-title">Road Construction to Begin Next Week</h3>
                    <p>The Department of Transportation announces a major road improvement project starting...</p>
                    <div class="news-meta">
                      <span>Main Street</span>
                      <span>3 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <script>
          // Location detection
          document.getElementById('update-location').addEventListener('click', function() {
            const locationDisplay = document.getElementById('location-display');
            locationDisplay.textContent = 'Requesting location...';
            
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                function(position) {
                  const lat = position.coords.latitude.toFixed(4);
                  const lng = position.coords.longitude.toFixed(4);
                  locationDisplay.textContent = `Current location: ${lat}, ${lng}`;
                  
                  // In a real app, you would fetch news for this location
                  console.log('Would fetch news for location:', lat, lng);
                },
                function(error) {
                  locationDisplay.textContent = 'Error getting location: ' + error.message;
                }
              );
            } else {
              locationDisplay.textContent = 'Geolocation is not supported by this browser.';
            }
          });
          
          // Trigger location update on page load
          document.getElementById('update-location').click();
        </script>
      </body>
    </html>
  `);
});

// Catch-all route
app.get('*', (req, res) => {
  res.redirect('/');
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`NewsGeo combined application running on http://0.0.0.0:${PORT}`);
});