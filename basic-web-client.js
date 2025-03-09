const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Home page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>NewsGeo Platform</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      width: 80%;
      margin: auto;
      overflow: hidden;
    }
    header {
      background: #50b3a2;
      color: white;
      padding-top: 30px;
      min-height: 70px;
      border-bottom: 3px solid #e8491d;
    }
    header a {
      color: white;
      text-decoration: none;
      text-transform: uppercase;
      font-size: 16px;
    }
    header .branding {
      float: left;
    }
    header .branding h1 {
      margin: 0;
    }
    header nav {
      float: right;
      margin-top: 10px;
    }
    header li {
      display: inline;
      padding: 0 20px;
    }
    header #branding h1 {
      margin: 0;
    }
    header .highlight, header .current a {
      color: #e8491d;
      font-weight: bold;
    }
    header a:hover {
      color: #cccccc;
      font-weight: bold;
    }
    #showcase {
      min-height: 400px;
      background: url('https://source.unsplash.com/random/1200x400/?news') no-repeat center;
      background-size: cover;
      text-align: center;
      color: white;
    }
    #showcase h1 {
      margin-top: 100px;
      font-size: 55px;
      margin-bottom: 10px;
    }
    #showcase p {
      font-size: 20px;
    }
    #boxes {
      margin-top: 20px;
    }
    #boxes .box {
      float: left;
      width: 30%;
      padding: 10px;
      text-align: center;
    }
    footer {
      padding: 20px;
      color: white;
      background-color: #50b3a2;
      text-align: center;
    }
    .button {
      display: inline-block;
      background: #e8491d;
      color: white;
      padding: 10px 20px;
      border: none;
      cursor: pointer;
      text-decoration: none;
      font-size: 15px;
      border-radius: 3px;
    }
    .button:hover {
      background: #333333;
      color: white;
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="branding">
        <h1><span class="highlight">NewsGeo</span> Platform</h1>
      </div>
      <nav>
        <ul>
          <li class="current"><a href="/">Home</a></li>
          <li><a href="/auth">Login/Register</a></li>
          <li><a href="/about">About</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <section id="showcase">
    <div class="container">
      <h1>Hyper-Local News Platform</h1>
      <p>Get news that matters based on your location</p>
      <a href="/auth" class="button">Get Started</a>
    </div>
  </section>

  <section id="boxes">
    <div class="container">
      <div class="box">
        <h3>Location-Based News</h3>
        <p>Receive news updates relevant to your specific location</p>
      </div>
      <div class="box">
        <h3>Real-Time Updates</h3>
        <p>Get breaking news as it happens with our WebSocket technology</p>
      </div>
      <div class="box">
        <h3>Cross-Platform</h3>
        <p>Access NewsGeo from any device - web or mobile</p>
      </div>
    </div>
  </section>

  <footer>
    <p>NewsGeo Platform &copy; 2025</p>
  </footer>
</body>
</html>
  `);
});

// Authentication page
app.get('/auth', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>NewsGeo - Authentication</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      width: 80%;
      margin: auto;
      overflow: hidden;
    }
    header {
      background: #50b3a2;
      color: white;
      padding-top: 30px;
      min-height: 70px;
      border-bottom: 3px solid #e8491d;
    }
    header a {
      color: white;
      text-decoration: none;
      text-transform: uppercase;
      font-size: 16px;
    }
    header .branding {
      float: left;
    }
    header .branding h1 {
      margin: 0;
    }
    header nav {
      float: right;
      margin-top: 10px;
    }
    header li {
      display: inline;
      padding: 0 20px;
    }
    header #branding h1 {
      margin: 0;
    }
    header .highlight, header .current a {
      color: #e8491d;
      font-weight: bold;
    }
    header a:hover {
      color: #cccccc;
      font-weight: bold;
    }
    .auth-container {
      display: flex;
      min-height: 80vh;
    }
    .form-container {
      flex: 1;
      padding: 20px;
      background: white;
    }
    .form-box {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
    }
    .hero-container {
      flex: 1;
      background: #50b3a2;
      color: white;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hero-content {
      max-width: 500px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    .form-group label {
      display: block;
      margin-bottom: 5px;
    }
    .form-group input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
    }
    .button {
      display: inline-block;
      background: #e8491d;
      color: white;
      padding: 10px 20px;
      border: none;
      cursor: pointer;
      text-decoration: none;
      font-size: 15px;
      border-radius: 3px;
    }
    .button:hover {
      background: #333333;
      color: white;
    }
    footer {
      padding: 20px;
      color: white;
      background-color: #50b3a2;
      text-align: center;
    }
    .toggle-link {
      display: block;
      margin-top: 15px;
      text-align: center;
      color: #50b3a2;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="branding">
        <h1><span class="highlight">NewsGeo</span> Platform</h1>
      </div>
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <li class="current"><a href="/auth">Login/Register</a></li>
          <li><a href="/about">About</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <div class="auth-container">
    <div class="form-container">
      <div class="form-box">
        <h2 id="form-title">Login to Your Account</h2>
        
        <form id="auth-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" required>
          </div>
          
          <div class="form-group" id="email-field" style="display:none;">
            <label for="email">Email</label>
            <input type="email" id="email" name="email">
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          
          <button type="submit" class="button" id="submit-button">Login</button>
        </form>
        
        <div id="error-message" style="color:red; margin-top:10px;"></div>
        
        <a class="toggle-link" id="toggle-form">Need an account? Register</a>
      </div>
    </div>
    
    <div class="hero-container">
      <div class="hero-content">
        <h1>NewsGeo</h1>
        <p>Get personalized news based on your location. Follow topics and sources that matter to you.</p>
        <ul>
          <li>Location-based news delivery</li>
          <li>Real-time updates</li>
          <li>Personalized feed</li>
          <li>Connect with your community</li>
        </ul>
      </div>
    </div>
  </div>

  <footer>
    <p>NewsGeo Platform &copy; 2025</p>
  </footer>
  
  <script>
    // Toggle between login and register forms
    let isLogin = true;
    const toggleForm = document.getElementById('toggle-form');
    const formTitle = document.getElementById('form-title');
    const submitButton = document.getElementById('submit-button');
    const emailField = document.getElementById('email-field');
    const errorMessage = document.getElementById('error-message');
    
    toggleForm.addEventListener('click', function() {
      isLogin = !isLogin;
      
      if (isLogin) {
        formTitle.textContent = 'Login to Your Account';
        submitButton.textContent = 'Login';
        toggleForm.textContent = 'Need an account? Register';
        emailField.style.display = 'none';
      } else {
        formTitle.textContent = 'Create a New Account';
        submitButton.textContent = 'Register';
        toggleForm.textContent = 'Already have an account? Login';
        emailField.style.display = 'block';
      }
      
      errorMessage.textContent = '';
    });
    
    // Form submission
    const authForm = document.getElementById('auth-form');
    
    authForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      // Simple form validation
      if (username === '') {
        errorMessage.textContent = 'Username is required';
        return;
      }
      
      if (password === '') {
        errorMessage.textContent = 'Password is required';
        return;
      }
      
      if (!isLogin) {
        const email = document.getElementById('email').value;
        if (email === '') {
          errorMessage.textContent = 'Email is required for registration';
          return;
        }
        
        // In a real app, we would send a registration request
        errorMessage.style.color = 'green';
        errorMessage.textContent = 'Registration successful! You can now log in.';
        
        // Reset form to login
        setTimeout(() => {
          isLogin = true;
          formTitle.textContent = 'Login to Your Account';
          submitButton.textContent = 'Login';
          toggleForm.textContent = 'Need an account? Register';
          emailField.style.display = 'none';
          document.getElementById('password').value = '';
          errorMessage.textContent = '';
        }, 2000);
        
      } else {
        // In a real app, we would authenticate the user
        if (username === 'demo' && password === 'password') {
          window.location.href = '/dashboard';
        } else {
          errorMessage.style.color = 'red';
          errorMessage.textContent = 'Invalid username or password';
        }
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
  <title>NewsGeo - Dashboard</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      width: 80%;
      margin: auto;
      overflow: hidden;
    }
    header {
      background: #50b3a2;
      color: white;
      padding-top: 30px;
      min-height: 70px;
      border-bottom: 3px solid #e8491d;
    }
    header a {
      color: white;
      text-decoration: none;
      text-transform: uppercase;
      font-size: 16px;
    }
    header .branding {
      float: left;
    }
    header .branding h1 {
      margin: 0;
    }
    header .user-info {
      float: right;
      margin-top: 10px;
    }
    .dash-container {
      display: flex;
      margin-top: 20px;
    }
    .sidebar {
      width: 250px;
      background: white;
      padding: 20px;
    }
    .main-content {
      flex: 1;
      padding: 20px;
      background: white;
      margin-left: 20px;
    }
    .nav-link {
      display: block;
      padding: 10px;
      color: #333;
      text-decoration: none;
      margin-bottom: 5px;
    }
    .nav-link:hover {
      background: #f4f4f4;
    }
    .nav-link.active {
      background: #50b3a2;
      color: white;
    }
    .news-card {
      border: 1px solid #ddd;
      margin-bottom: 20px;
      padding: 15px;
    }
    .news-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    .button {
      display: inline-block;
      background: #e8491d;
      color: white;
      padding: 10px 20px;
      border: none;
      cursor: pointer;
      text-decoration: none;
      font-size: 15px;
      border-radius: 3px;
    }
    .location-box {
      background: #f4f4f4;
      padding: 15px;
      margin-bottom: 20px;
    }
    footer {
      padding: 20px;
      color: white;
      background-color: #50b3a2;
      text-align: center;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="branding">
        <h1><span class="highlight">NewsGeo</span> Dashboard</h1>
      </div>
      <div class="user-info">
        <span>Welcome, Demo User</span>
        <a href="/" class="button" style="margin-left:15px;">Logout</a>
      </div>
    </div>
  </header>

  <div class="container dash-container">
    <div class="sidebar">
      <nav>
        <a href="#" class="nav-link active">News Feed</a>
        <a href="#" class="nav-link">My Location</a>
        <a href="#" class="nav-link">Following</a>
        <a href="#" class="nav-link">Notifications</a>
        <a href="#" class="nav-link">Upload News</a>
        <a href="#" class="nav-link">Profile</a>
        <a href="#" class="nav-link">Settings</a>
      </nav>
    </div>
    
    <div class="main-content">
      <h2>Your News Feed</h2>
      <p>Welcome back! Here's the latest news based on your location.</p>
      
      <div class="location-box">
        <h3>Your Location</h3>
        <p id="location-display">Detecting your location...</p>
        <button id="update-location" class="button">Update Location</button>
      </div>
      
      <div class="news-grid">
        <div class="news-card">
          <h3>Local Community Event This Weekend</h3>
          <p>Join the community for a special gathering at the downtown park with live music and food...</p>
          <div style="display:flex; justify-content:space-between; color:#777;">
            <span>Downtown</span>
            <span>10 min ago</span>
          </div>
        </div>
        
        <div class="news-card">
          <h3>Weather Alert: Storm System Approaching</h3>
          <p>Meteorologists are tracking a storm system that is expected to bring heavy rain to the...</p>
          <div style="display:flex; justify-content:space-between; color:#777;">
            <span>Regional</span>
            <span>1 hour ago</span>
          </div>
        </div>
        
        <div class="news-card">
          <h3>New Restaurant Opening Creates Buzz</h3>
          <p>A new farm-to-table restaurant is opening in the Arts District next week, featuring...</p>
          <div style="display:flex; justify-content:space-between; color:#777;">
            <span>Arts District</span>
            <span>2 hours ago</span>
          </div>
        </div>
        
        <div class="news-card">
          <h3>Road Construction to Begin Next Week</h3>
          <p>The Department of Transportation announces a major road improvement project starting...</p>
          <div style="display:flex; justify-content:space-between; color:#777;">
            <span>Main Street</span>
            <span>3 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <footer>
    <p>NewsGeo Platform &copy; 2025</p>
  </footer>
  
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
            locationDisplay.textContent = 'Current location: ' + lat + ', ' + lng;
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

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is online',
    timestamp: new Date().toISOString()
  });
});

// Catch-all route
app.get('*', (req, res) => {
  res.redirect('/');
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`NewsGeo Web Client running on http://0.0.0.0:${PORT}`);
});