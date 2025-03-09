// Simple authentication form
document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  const API_URL = ''; // Empty string to use relative URLs

  // Clear loading indicator
  root.innerHTML = '';

  // Create content container
  const container = document.createElement('div');
  container.className = 'auth-container';
  container.style.display = 'flex';
  container.style.minHeight = '100vh';
  container.style.backgroundColor = '#f0f2f5';

  // Check if user is logged in
  fetch(`${API_URL}/api/user`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error('Not authenticated');
  })
  .then(user => {
    // User is logged in, show home page
    renderHomePage(container, user);
  })
  .catch(error => {
    // User is not logged in, show auth page
    renderAuthPage(container);
  });

  root.appendChild(container);
});

// Render the home page for authenticated users
function renderHomePage(container, user) {
  container.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; padding: 2rem; width: 100%;">
      <header style="margin-bottom: 2rem;">
        <h1 style="font-size: 2rem; font-weight: bold; color: #333;">NewsGeo</h1>
        <p style="color: #666;">Your location-based news platform</p>
      </header>
      
      <div style="background-color: white; border-radius: 8px; padding: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Welcome, ${user.username}!</h2>
        
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem;">Your Profile</h3>
          <p style="margin-bottom: 0.5rem;"><strong>Username:</strong> ${user.username}</p>
          <p style="margin-bottom: 0.5rem;"><strong>Email:</strong> ${user.email || 'Not provided'}</p>
        </div>
        
        <button id="logout-button" style="background-color: #e53e3e; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; cursor: pointer; font-weight: bold;">Logout</button>
      </div>
    </div>
  `;

  // Add logout functionality
  document.getElementById('logout-button').addEventListener('click', function() {
    fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    })
    .then(() => {
      window.location.reload();
    })
    .catch(error => {
      console.error('Logout failed:', error);
    });
  });
}

// Render the authentication page
function renderAuthPage(container) {
  container.innerHTML = `
    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2rem;">
      <div style="background-color: white; border-radius: 8px; padding: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 100%; max-width: 400px;">
        <h2 id="auth-title" style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1.5rem; text-align: center;">Login to Your Account</h2>
        
        <form id="auth-form">
          <div style="margin-bottom: 1rem;">
            <label for="username" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Username</label>
            <input id="username" name="username" type="text" required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
          </div>
          
          <div id="email-field" style="margin-bottom: 1rem; display: none;">
            <label for="email" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email</label>
            <input id="email" name="email" type="email" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <label for="password" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Password</label>
            <input id="password" name="password" type="password" required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
          </div>
          
          <button type="submit" style="width: 100%; background-color: #3b82f6; color: white; border: none; border-radius: 4px; padding: 0.75rem; font-weight: bold; cursor: pointer;">
            <span id="auth-button-text">Login</span>
          </button>
        </form>
        
        <div id="error-message" style="color: #e53e3e; margin-top: 1rem; text-align: center;"></div>
        
        <div style="margin-top: 1.5rem; text-align: center;">
          <button id="toggle-auth" style="background: none; border: none; color: #3b82f6; cursor: pointer;">
            Need an account? Register
          </button>
        </div>
      </div>
    </div>
    
    <div style="flex: 1; background-color: #3b82f6; padding: 2rem; display: none; align-items: center; justify-content: center;" class="hero-section">
      <div style="color: white; max-width: 400px;">
        <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem;">NewsGeo</h1>
        <p style="font-size: 1.25rem; margin-bottom: 1.5rem;">
          Your personalized news platform with location-based content delivery.
        </p>
        <ul style="list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1.5rem;">
          <li style="margin-bottom: 0.5rem;">Hyper-local news based on your location</li>
          <li style="margin-bottom: 0.5rem;">Real-time breaking news updates</li>
          <li style="margin-bottom: 0.5rem;">Follow your favorite news sources</li>
          <li style="margin-bottom: 0.5rem;">Engage with your community</li>
        </ul>
      </div>
    </div>
  `;
  
  // Show hero section on larger screens
  if (window.innerWidth >= 768) {
    document.querySelector('.hero-section').style.display = 'flex';
  }

  let isLogin = true;
  const authForm = document.getElementById('auth-form');
  const toggleAuthButton = document.getElementById('toggle-auth');
  const authTitle = document.getElementById('auth-title');
  const authButtonText = document.getElementById('auth-button-text');
  const emailField = document.getElementById('email-field');
  const errorMessage = document.getElementById('error-message');
  
  // Toggle between login and register
  toggleAuthButton.addEventListener('click', function() {
    isLogin = !isLogin;
    
    if (isLogin) {
      authTitle.textContent = 'Login to Your Account';
      authButtonText.textContent = 'Login';
      toggleAuthButton.textContent = 'Need an account? Register';
      emailField.style.display = 'none';
    } else {
      authTitle.textContent = 'Create New Account';
      authButtonText.textContent = 'Register';
      toggleAuthButton.textContent = 'Already have an account? Login';
      emailField.style.display = 'block';
    }
    
    errorMessage.textContent = '';
  });
  
  // Handle form submission
  authForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
      username: document.getElementById('username').value,
      password: document.getElementById('password').value,
    };
    
    if (!isLogin) {
      formData.email = document.getElementById('email').value;
    }
    
    const endpoint = isLogin ? '/api/login' : '/api/register';
    
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(formData),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.message || 'Authentication failed');
        });
      }
      return response.json();
    })
    .then(data => {
      // Successful login or registration
      window.location.reload();
    })
    .catch(error => {
      errorMessage.textContent = error.message;
    });
  });
}