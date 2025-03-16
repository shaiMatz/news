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
import SearchScreen from '../screens/SearchScreen';
import LiveStreamScreen from '../screens/LiveStreamScreen';
import LoadingIndicator from '../components/LoadingIndicator';
import NotificationBadge from '../components/NotificationBadge';
import ProtectedRoute from '../components/ProtectedRoute';
import AuthModal from '../components/AuthModal';
import LiveShareButton from '../components/LiveShareButton';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  
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
  
  // Handle actions that require authentication
  const handleAuthRequiredAction = (action) => {
    if (!user) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };
  
  // Handle upload button press
  const handleUploadPress = (navigation) => {
    if (handleAuthRequiredAction('upload')) {
      navigation.navigate('Upload');
    }
  };
  
  // Custom tab bar with centered upload button
  const CustomTabBar = ({ state, descriptors, navigation }) => {
    return (
      <View style={[styles.tabBarContainer, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          
          // Center upload button
          if (route.name === 'Upload') {
            return (
              <View key={route.key} style={styles.uploadButton}>
                <LiveShareButton 
                  onPress={() => {
                    if (user) {
                      // User is logged in, show options
                      return false; // Let the component handle it
                    } else {
                      // User is not logged in, show auth modal
                      setShowAuthModal(true);
                      return true; // Indicates we handled the press
                    }
                  }}
                />
              </View>
            );
          }
          
          // Regular tab buttons
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                });

                if (!isFocused && !event.defaultPrevented) {
                  if (route.name === 'Notifications' && !user) {
                    handleAuthRequiredAction('notifications');
                  } else {
                    navigation.navigate(route.name);
                  }
                }
              }}
              style={styles.tabButton}
            >
              {options.tabBarIcon({ 
                color: isFocused ? theme.primary : theme.textSecondary,
                focused: isFocused
              })}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          headerShown: false,
        }}
        tabBar={props => <CustomTabBar {...props} />}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabIconContainer}>
                <Feather name="home" size={24} color={color} />
                {focused && <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />}
              </View>
            ),
          }}
        />
        <Tab.Screen 
          name="Upload" 
          component={UploadNewsScreen} 
          options={{
            tabBarIcon: ({ color }) => <Feather name="plus" size={24} color={color} />,
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              // Prevent default behavior
              e.preventDefault();
              // Custom handler (already implemented in CustomTabBar)
            },
          })}
        />
        <Tab.Screen 
          name="Notifications" 
          component={NotificationsScreen} 
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabIconContainer}>
                <View>
                  <Feather name="bell" size={24} color={color} />
                  {notificationCount > 0 && (
                    <NotificationBadge count={notificationCount} autoUpdate={false} />
                  )}
                </View>
                {focused && <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />}
              </View>
            ),
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabIconContainer}>
                <Feather name="user" size={24} color={color} />
                {focused && <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />}
              </View>
            ),
          }}
        />
      </Tab.Navigator>

      {/* Auth Modal for login/register when needed */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialTab="login"
      />
    </>
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
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <>
      <Stack.Navigator>
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
        
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen} 
          options={{ headerShown: false }}
        />

        <Stack.Screen 
          name="Search" 
          component={SearchScreen} 
          options={{ headerShown: false }}
        />
        
        <Stack.Screen 
          name="LiveStream" 
          component={LiveStreamScreen} 
          options={{ 
            headerShown: false,
            presentation: 'fullScreenModal'
          }}
        />
        
        {user && (
          <>
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
      </Stack.Navigator>
      
      {/* Auth Modal for login/register when needed */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialTab="login"
      />
    </>
  );
}

// Styles for the custom tab bar
const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    paddingBottom: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  uploadButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});
