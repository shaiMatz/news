import React from 'react';
import { Switch, Route, Link } from 'wouter';
import { useAuth } from './hooks/use-auth';
import { ProtectedRoute } from './lib/protected-route';

// Placeholder Home Page Component
function HomePage() {
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to NewsGeo</h1>
      <p className="mb-4">Hello, {user?.username || 'Guest'}!</p>
      
      {user && (
        <button 
          onClick={handleLogout} 
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          Logout
        </button>
      )}
    </div>
  );
}

// Auth Page Component
function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [isLogin, setIsLogin] = React.useState(true);
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: '',
  });
  
  // Redirect if already logged in
  if (user) {
    return <Route path="/auth"><Link to="/" replace>Go to Home</Link></Route>;
  }
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isLogin) {
      loginMutation.mutate({
        username: formData.username,
        password: formData.password,
      });
    } else {
      registerMutation.mutate({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Form column */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isLogin ? 'Login to Your Account' : 'Create New Account'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            
            {!isLogin && (
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              disabled={loginMutation.isLoading || registerMutation.isLoading}
            >
              {isLogin ? 'Login' : 'Register'}
              {(loginMutation.isLoading || registerMutation.isLoading) && '...'}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-500 hover:text-blue-700"
            >
              {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Hero column */}
      <div className="hidden md:flex flex-1 bg-blue-500 items-center justify-center p-6">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-4">NewsGeo</h1>
          <p className="text-xl mb-6">
            Your personalized news platform with location-based content delivery.
          </p>
          <ul className="list-disc list-inside mb-6">
            <li>Hyper-local news based on your location</li>
            <li>Real-time breaking news updates</li>
            <li>Follow your favorite news sources</li>
            <li>Engage with your community</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// 404 Not Found Page
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-lg mb-6">Page not found</p>
      <Link href="/">
        <a className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Go Home
        </a>
      </Link>
    </div>
  );
}

// Main App Component
export default function App() {
  return (
    <div className="min-h-screen">
      <Switch>
        <ProtectedRoute path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </div>
  );
}