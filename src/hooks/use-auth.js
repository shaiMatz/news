import { createContext, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { useLocation } from "wouter";

const API_BASE_URL = "http://localhost:8080";

// API request helper function
async function apiRequest(method, endpoint, data = null) {
  const url = `${API_BASE_URL}${endpoint}`;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return method === 'DELETE' ? null : response.json();
}

// Query client function for authentication-related requests
const getQueryFn = (options = {}) => async ({ queryKey }) => {
  const [endpoint] = queryKey;
  try {
    return await apiRequest('GET', endpoint);
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

  // Query to get the current user
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      return await apiRequest('POST', '/api/login', credentials);
    },
    onSuccess: (userData) => {
      refetch();
      navigate('/');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData) => {
      return await apiRequest('POST', '/api/register', userData);
    },
    onSuccess: (userData) => {
      refetch();
      navigate('/');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/logout');
    },
    onSuccess: () => {
      refetch();
      navigate('/auth');
    },
  });

  // Context value
  const value = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    loginMutation,
    registerMutation,
    logoutMutation,
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