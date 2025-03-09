import React, { useState, useEffect } from 'react';
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
import LoadingIndicator from '../components/LoadingIndicator';
import NotificationBadge from '../components/NotificationBadge';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getUnreadNotificationCount, addRealtimeNotificationListener, configureNotifications } from '../services/notifications';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Configure notifications
  useEffect(() => {
    configureNotifications();
  }, []);
  
  // Effect to set up real-time notifications and fetch unread count
  useEffect(() => {
    // Initial fetch of notification count
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount();
        setNotificationCount(count);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };
    
    fetchUnreadCount();
    
    // Set up real-time notification listener
    const removeListener = addRealtimeNotificationListener((notification) => {
      // Update count when new notification is received
      setNotificationCount(prevCount => prevCount + 1);
    }, user);
    
    // Clean up listener on unmount
    return () => {
      if (removeListener) removeListener();
    };
  }, [user]);
  
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
              <NotificationBadge count={notificationCount} />
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

export default function AppNavigator() {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen 
            name="Main" 
            component={MainTabNavigator} 
            options={{ headerShown: false }}
          />
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
        </>
      ) : (
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen} 
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
