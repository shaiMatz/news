// Simple authentication form with i18n support
document.addEventListener('DOMContentLoaded', function () {
  console.log("Document ready, initializing auth app");
  
  // Create a translation function that works even if i18n is not fully initialized
  const safeT = (key) => {
    // If i18n is not initialized, use simple English fallbacks
    if (!window.i18n || !window.i18n.translations[window.i18n?.language || 'en']) {
      const fallbacks = {
        'auth.login': 'Login',
        'auth.register': 'Register',
        'auth.logout': 'Logout',
        'auth.username': 'Username',
        'auth.password': 'Password',
        'auth.email': 'Email',
        'auth.noAccount': "Don't have an account?",
        'auth.alreadyAccount': 'Already have an account?',
        'profile.profile': 'Profile',
        'profile.accountInfo': 'Account Information',
        'news.nearby': 'Nearby News',
        'errors.notProvided': 'Not provided'
      };
      return fallbacks[key] || key;
    }
    
    // Use i18n if it's available
    return window.i18n.t(key);
  };

  const root = document.getElementById('root');
  const API_URL = ''; // Empty string to use relative URLs
  // Use our safe translation function
  const t = safeT;

  // Clear loading indicator
  root.innerHTML = '';

  // Create content container
  const container = document.createElement('div');
  container.className = 'auth-container';
  container.style.display = 'flex';
  container.style.minHeight = '100vh';
  container.style.backgroundColor = '#f0f2f5';

  // Handle RTL layout - safely check if i18n is available
  if (window.i18n && typeof window.i18n.isRTL === 'function' && window.i18n.isRTL()) {
    container.style.flexDirection = 'row-reverse';
  }

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

// Listen for language changes
window.addEventListener('languagechange', function(e) {
  // Refresh the page to apply new translations
  window.location.reload();
});

// Render the home page for authenticated users
function renderHomePage(container, user) {
  // Create a safe translation function for this component
  const t = (key) => {
    // If i18n is not initialized, use simple English fallbacks
    if (!window.i18n || !window.i18n.translations[window.i18n?.language || 'en']) {
      const fallbacks = {
        'auth.login': 'Login',
        'auth.register': 'Register',
        'auth.logout': 'Logout',
        'auth.username': 'Username',
        'auth.email': 'Email',
        'auth.noAccount': "Don't have an account?",
        'auth.alreadyAccount': 'Already have an account?',
        'profile.profile': 'Profile',
        'profile.accountInfo': 'Account Information',
        'news.nearby': 'Nearby News',
        'errors.notProvided': 'Not provided'
      };
      return fallbacks[key] || key;
    }
    
    // Use i18n if it's available
    return window.i18n.t(key);
  };
  
  // Safely check RTL status
  const isRTL = window.i18n && typeof window.i18n.isRTL === 'function' && window.i18n.isRTL();
  const textAlign = isRTL ? 'right' : 'left';

  container.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; padding: 2rem; width: 100%; text-align: ${textAlign};">
      <header style="margin-bottom: 2rem;">
        <h1 style="font-size: 2rem; font-weight: bold; color: #333;">NewsGeo</h1>
        <p style="color: #666;">${t('news.nearby')}</p>
      </header>
      
      <div style="background-color: white; border-radius: 8px; padding: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">${t('profile.profile')}: ${user.username}</h2>
        
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem;">${t('profile.accountInfo')}</h3>
          <p style="margin-bottom: 0.5rem;"><strong>${t('auth.username')}:</strong> ${user.username}</p>
          <p style="margin-bottom: 0.5rem;"><strong>${t('auth.email')}:</strong> ${user.email || t('errors.notProvided')}</p>
        </div>
        
        <button id="logout-button" style="background-color: #e53e3e; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; cursor: pointer; font-weight: bold;">${t('auth.logout')}</button>
      </div>
    </div>
  `;

  // Add logout functionality
  document.getElementById('logout-button').addEventListener('click', function () {
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
  // Create a safe translation function for this component
  const t = (key) => {
    // If i18n is not initialized, use simple English fallbacks
    if (!window.i18n || !window.i18n.translations[window.i18n?.language || 'en']) {
      const fallbacks = {
        'auth.login': 'Login',
        'auth.register': 'Register',
        'auth.logout': 'Logout',
        'auth.username': 'Username',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.noAccount': "Don't have an account?",
        'auth.alreadyAccount': 'Already have an account?',
        'auth.signIn': 'Sign In',
        'auth.signUp': 'Sign Up',
        'news.nearby': 'Nearby News',
        'news.breakingNews': 'Breaking News',
        'news.trending': 'Trending'
      };
      return fallbacks[key] || key;
    }
    
    // Use i18n if it's available
    return window.i18n.t(key);
  };
  
  // Safely check RTL status
  const isRTL = window.i18n && typeof window.i18n.isRTL === 'function' && window.i18n.isRTL();
  const textAlign = isRTL ? 'right' : 'left';
  const marginSide = isRTL ? 'margin-right' : 'margin-left';

  container.innerHTML = `
    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2rem;">
      <div style="background-color: white; border-radius: 8px; padding: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: ${textAlign};">
        <h2 id="auth-title" style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1.5rem; text-align: center;">${t('auth.signIn')}</h2>
        
        <form id="auth-form">
          <div style="margin-bottom: 1rem;">
            <label for="username" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">${t('auth.username')}</label>
            <input id="username" name="username" type="text" required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
          </div>
          
          <div id="email-field" style="margin-bottom: 1rem; display: none;">
            <label for="email" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">${t('auth.email')}</label>
            <input id="email" name="email" type="email" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <label for="password" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">${t('auth.password')}</label>
            <input id="password" name="password" type="password" required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
          </div>
          
          <button type="submit" style="width: 100%; background-color: #3b82f6; color: white; border: none; border-radius: 4px; padding: 0.75rem; font-weight: bold; cursor: pointer;">
            <span id="auth-button-text">${t('auth.login')}</span>
          </button>
        </form>
        
        <div id="error-message" style="color: #e53e3e; margin-top: 1rem; text-align: center;"></div>
        
        <div style="margin-top: 1.5rem; text-align: center;">
          <button id="toggle-auth" style="background: none; border: none; color: #3b82f6; cursor: pointer;">
            ${t('auth.noAccount')} ${t('auth.register')}
          </button>
        </div>
      </div>
    </div>
    
    <div style="flex: 1; background-color: #3b82f6; padding: 2rem; display: none; align-items: center; justify-content: center;" class="hero-section">
      <div style="color: white; max-width: 400px; text-align: ${textAlign};">
        <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem;">NewsGeo</h1>
        <p style="font-size: 1.25rem; margin-bottom: 1.5rem;">
          ${t('news.nearby')}
        </p>
        <ul style="list-style-type: disc; ${marginSide}: 1.5rem; margin-bottom: 1.5rem;">
          <li style="margin-bottom: 0.5rem;">${t('news.nearby')}</li>
          <li style="margin-bottom: 0.5rem;">${t('news.breakingNews')}</li>
          <li style="margin-bottom: 0.5rem;">${t('news.trending')}</li>
          <li style="margin-bottom: 0.5rem;">${t('auth.login')}</li>
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
  toggleAuthButton.addEventListener('click', function () {
    isLogin = !isLogin;

    if (isLogin) {
      authTitle.textContent = t('auth.signIn');
      authButtonText.textContent = t('auth.login');
      toggleAuthButton.textContent = `${t('auth.noAccount')} ${t('auth.register')}`;
      emailField.style.display = 'none';
    } else {
      authTitle.textContent = t('auth.signUp');
      authButtonText.textContent = t('auth.register');
      toggleAuthButton.textContent = `${t('auth.alreadyAccount')} ${t('auth.login')}`;
      emailField.style.display = 'block';
    }

    errorMessage.textContent = '';
  });

  // Handle form submission
  authForm.addEventListener('submit', function (e) {
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