import { createContext, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useLocation } from "wouter";

// Updated API URL to match our server port
const API_BASE_URL = "http://localhost:8080";

// Token storage keys
const TOKEN_KEY = 'newsgeo_auth_token';
const USER_KEY = 'newsgeo_user';

/**
 * Enhanced API request helper function with JWT support
 * 
 * @param {string} method - HTTP method 
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request payload data
 * @param {boolean} useJwt - Whether to use JWT auth
 * @returns {Promise<any>} API response
 */
async function apiRequest(method, endpoint, data = null, useJwt = true) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem(TOKEN_KEY);

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // For cookies/session auth
  };

  // Add JWT token if available and requested
  if (token && useJwt) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);

    // Handle token expiration
    if (response.status === 401 && token && useJwt) {
      // Try to refresh the token
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/api/refresh-token`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          
          // Store the new token
          localStorage.setItem(TOKEN_KEY, refreshData.token);
          
          // Retry the original request with the new token
          options.headers['Authorization'] = `Bearer ${refreshData.token}`;
          const retryResponse = await fetch(url, options);
          
          if (!retryResponse.ok) {
            throw new Error(await processErrorResponse(retryResponse));
          }
          
          return method === 'DELETE' ? null : retryResponse.json();
        } else {
          // If refresh fails, clear auth data
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          throw new Error('Session expired. Please log in again.');
        }
      } catch (refreshError) {
        // Clear auth data on refresh error
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        throw refreshError;
      }
    }

    if (!response.ok) {
      throw new Error(await processErrorResponse(response));
    }

    return method === 'DELETE' ? null : response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Process error response to extract meaningful error messages
 */
async function processErrorResponse(response) {
  try {
    const errorData = await response.json();
    // Handle different error response formats
    if (errorData.errors && Array.isArray(errorData.errors)) {
      // Validation errors from express-validator
      return errorData.errors.map(err => err.msg).join(', ');
    } else if (errorData.message) {
      return errorData.message;
    } else if (errorData.error && errorData.error === true && errorData.message) {
      return errorData.message;
    } else {
      return `Request failed with status ${response.status}`;
    }
  } catch (e) {
    return `Request failed with status ${response.status}`;
  }
}

/**
 * Query client function for authentication-related requests
 */
const getQueryFn = (options = {}) => async ({ queryKey }) => {
  const [endpoint] = queryKey;
  try {
    return await apiRequest('GET', endpoint, null, options.useJwt !== false);
  } catch (error) {
    if (error.message.includes('401') && options.on401 === 'returnNull') {
      return null;
    }
    throw error;
  }
};

// Context for auth state
const AuthContext = createContext(null);

// Auth provider component
export function AuthProvider({ children }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // State to hold token info
  const [authToken, setAuthToken] = useState(localStorage.getItem(TOKEN_KEY));
  
  // Initialize user from localStorage if available
  const [initialUser, setInitialUser] = useState(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Query to get the current user - use stored user until API response arrives
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    retry: false,
    initialData: initialUser,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Save user data to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      // Validate input before sending request
      if (!credentials.username || !credentials.password) {
        throw new Error('Username and password are required');
      }
      
      try {
        return await apiRequest('POST', '/api/login', credentials, false);
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Store token and user data
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setAuthToken(data.token);
      
      // Update query cache
      queryClient.setQueryData(['/api/user'], data.user);
      
      // Navigate to home page
      navigate('/');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData) => {
      // Validate input before sending request
      if (!userData.username || !userData.password || !userData.email) {
        throw new Error('Username, email, and password are required');
      }
      
      // Check password complexity
      if (userData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      // Check for password complexity using regex
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(userData.password)) {
        throw new Error(
          'Password must contain at least one uppercase letter, one lowercase letter, ' +
          'one number, and one special character'
        );
      }
      
      try {
        return await apiRequest('POST', '/api/register', userData, false);
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Store token and user data
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setAuthToken(data.token);
      
      // Update query cache
      queryClient.setQueryData(['/api/user'], data.user);
      
      // Navigate to home page
      navigate('/');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        // Call the logout API endpoint
        await apiRequest('POST', '/api/logout');
      } finally {
        // Clear local storage and state even if API call fails
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setAuthToken(null);
        queryClient.setQueryData(['/api/user'], null);
        return true;
      }
    },
    onSuccess: () => {
      // Invalidate any authenticated queries
      queryClient.invalidateQueries();
      
      // Navigate to auth page
      navigate('/auth');
    },
  });
  
  // Token refresh mutation
  const refreshTokenMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/refresh-token');
    },
    onSuccess: (data) => {
      localStorage.setItem(TOKEN_KEY, data.token);
      setAuthToken(data.token);
    },
  });

  // Context value
  const value = {
    user,
    isLoading,
    error,
    token: authToken,
    isAuthenticated: !!user,
    loginMutation,
    registerMutation,
    logoutMutation,
    refreshTokenMutation,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}