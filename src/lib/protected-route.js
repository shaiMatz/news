import { useEffect } from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth';

/**
 * ProtectedRoute component - wraps routes that require authentication
 * Redirects to auth screen if user is not logged in
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 * @param {string} props.path - The path this route should match
 * @param {Function} props.component - Component to render (alternative to children)
 */
export function ProtectedRoute({ children, path, component: Component }) {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // After authentication checks, redirect if needed
    if (!isLoading && !isAuthenticated) {
      setLocation('/auth');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // If authenticated, render the protected content
  if (isAuthenticated) {
    if (Component) {
      return <Component />;
    }
    return children;
  }

  // Redirect to auth page if not authenticated
  return <Redirect to="/auth" />;
}

/**
 * withAuth higher-order component - wraps components that require authentication
 * 
 * @param {Function} WrappedComponent - Component to wrap with authentication
 * @returns {Function} Authentication-protected component
 */
export function withAuth(WrappedComponent) {
  return function WithAuthComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();
    const [, setLocation] = useLocation();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        setLocation('/auth');
      }
    }, [isLoading, isAuthenticated, setLocation]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      );
    }

    if (isAuthenticated) {
      return <WrappedComponent {...props} />;
    }

    return null;
  };
}

export default ProtectedRoute;