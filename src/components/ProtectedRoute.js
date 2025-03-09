import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import LoadingIndicator from './LoadingIndicator';
import { useNavigation } from '@react-navigation/native';

/**
 * ProtectedRoute component - wraps routes that require authentication
 * Redirects to auth screen if user is not logged in
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const navigation = useNavigation();
  
  // If auth status is still loading, show loading indicator
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <LoadingIndicator size="large" />
      </View>
    );
  }
  
  // If not authenticated, redirect to auth screen
  if (!user) {
    // Use setTimeout to avoid navigation during render
    setTimeout(() => {
      navigation.navigate('Auth');
    }, 0);
    
    // Return null to avoid rendering children
    return null;
  }
  
  // User is authenticated, render children
  return <>{children}</>;
}