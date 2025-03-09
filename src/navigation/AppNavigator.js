import React, { useState, useEffect, useCallback } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import AuthScreen from '../screens/AuthScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import UploadNewsScreen from '../screens/UploadNewsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import FollowersScreen from '../screens/FollowersScreen';
import FollowingScreen from '../screens/FollowingScreen';
import LoadingIndicator from '../components/LoadingIndicator';
import NotificationBadge from '../components/NotificationBadge';
import ProtectedRoute from '../components/ProtectedRoute';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { 
  getUnreadNotificationCount, 
  addRealtimeNotificationListener, 
  configureNotifications 
} from '../services/notifications';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Tab navigator for main app screens
 * These screens are only accessible when authenticated
 */
function MainTabNavigator() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Configure notifications
  useEffect(() => {
    configureNotifications();
  }, []);
  
  // Fetch notification count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const count = await getUnreadNotificationCount();
      setNotificationCount(count);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }, [user]);
  
  // Effect to set up real-time notifications and fetch unread count
  useEffect(() => {
    // Skip if no user is logged in
    if (!user) return;
    
    // Initial fetch
    fetchUnreadCount();
    
    // Set up real-time notification listener
    const removeListener = addRealtimeNotificationListener((notification) => {
      // Update count when new notification is received
      if (!notification.read) {
        setNotificationCount(prevCount => prevCount + 1);
      }
    }, user);
    
    // Set up interval to refresh count
    const intervalId = setInterval(fetchUnreadCount, 60000); // Refresh every minute
    
    // Clean up on unmount
    return () => {
      if (removeListener) removeListener();
      clearInterval(intervalId);
    };
  }, [user, fetchUnreadCount]);
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 5,
          backgroundColor: theme.cardBackground,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Upload" 
        component={UploadNewsScreen} 
        options={{
          tabBarIcon: ({ color }) => <Feather name="upload" size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{
          tabBarIcon: ({ color }) => (
            <View>
              <Feather name="bell" size={24} color={color} />
              {notificationCount > 0 && (
                <NotificationBadge count={notificationCount} autoUpdate={false} />
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Protected component wrapper for authenticated screens
 */
function ProtectedMainNavigator() {
  return (
    <ProtectedRoute>
      <MainTabNavigator />
    </ProtectedRoute>
  );
}

/**
 * Protected component wrapper for news detail screen
 */
function ProtectedNewsDetail(props) {
  return (
    <ProtectedRoute>
      <NewsDetailScreen {...props} />
    </ProtectedRoute>
  );
}

/**
 * Main app navigator that handles authentication flow
 */
export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Main" 
        component={user ? MainTabNavigator : AuthScreen}
        options={{ headerShown: false }}
      />
      
      {user && (
        <>
          <Stack.Screen 
            name="NewsDetail" 
            component={NewsDetailScreen} 
            options={{
              title: '',
              headerBackTitleVisible: false,
              headerStyle: {
                backgroundColor: theme.background,
                shadowColor: 'transparent',
              },
              headerTintColor: theme.primary,
            }}
          />
          
          <Stack.Screen 
            name="Followers" 
            component={FollowersScreen} 
            options={{
              title: 'Followers',
              headerBackTitleVisible: false,
              headerStyle: {
                backgroundColor: theme.background,
                shadowColor: 'transparent',
              },
              headerTintColor: theme.primary,
            }}
          />
          
          <Stack.Screen 
            name="Following" 
            component={FollowingScreen} 
            options={{
              title: 'Following',
              headerBackTitleVisible: false,
              headerStyle: {
                backgroundColor: theme.background,
                shadowColor: 'transparent',
              },
              headerTintColor: theme.primary,
            }}
          />
        </>
      )}
      
      {!user && (
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen} 
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
