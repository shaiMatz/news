import React from 'react';
import { useAuth } from '../hooks/use-auth';
import { Route, Redirect } from 'wouter';

export function ProtectedRoute({
  path,
  component: Component,
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      {user ? <Component /> : <Redirect to="/auth" />}
    </Route>
  );
}