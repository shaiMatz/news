import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Animated,
  Modal
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  fetchUserProfile 
} from '../services/api';
import LoadingIndicator from '../components/LoadingIndicator';
import { useTheme } from '../contexts/ThemeContext';
import NotificationItem from '../components/NotificationItem';
import NotificationFilter from '../components/NotificationFilter';
import NotificationSettings from '../components/NotificationSettings';
import NotificationTester from '../components/NotificationTester';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState(['all']);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userSettings, setUserSettings] = useState(null);
  const [headerAnimation] = useState(new Animated.Value(1));
  
  const navigation = useNavigation();
  const { theme } = useTheme();

  // Load notifications from the API
  const loadNotifications = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const fetchedNotifications = await fetchNotifications();
      setNotifications(fetchedNotifications);
      applyFilters(fetchedNotifications, selectedFilters);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load user settings
  const loadUserSettings = async () => {
    try {
      const userProfile = await fetchUserProfile();
      setUserSettings(userProfile?.settings?.notificationSettings || {});
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  };

  // Initial data loading
  useEffect(() => {
    loadNotifications();
    loadUserSettings();
  }, []);

  // Apply filters to notifications when selected filters or notifications change
  const applyFilters = useCallback((notificationsToFilter, filters) => {
    if (filters.includes('all')) {
      setFilteredNotifications(notificationsToFilter);
      return;
    }
    
    const filtered = notificationsToFilter.filter(notification => 
      filters.includes(notification.type)
    );
    
    setFilteredNotifications(filtered);
  }, []);

  useEffect(() => {
    applyFilters(notifications, selectedFilters);
  }, [selectedFilters, notifications, applyFilters]);

  // Handle refresh
  const handleRefresh = () => {
    loadNotifications(true);
  };

  // Handle notification press
  const handleNotificationPress = async (notification) => {
    try {
      // Handle action if this is an action-oriented press
      if (notification.action) {
        // Handle specific action based on notification type
        if (notification.actionType === 'follow') {
          // Navigate to the user profile to follow
          navigation.navigate('Profile', { userId: notification.referenceId });
        } else if (notification.actionType === 'event') {
          // Navigate to an event detail
          navigation.navigate('EventDetail', { eventId: notification.referenceId });
        }
        return;
      }
      
      // Otherwise handle regular notification press
      if (!notification.read) {
        // Mark as read in the UI immediately for better UX
        setNotifications(prevNotifications => 
          prevNotifications.map(n => 
            n.id === notification.id ? {...n, read: true} : n
          )
        );
        
        // Send API request to mark as read
        await markNotificationAsRead(notification.id);
      }
      
      // Navigate based on notification type
      if (notification.type === 'news') {
        navigation.navigate('NewsDetail', { newsId: notification.referenceId });
      } else if (notification.type === 'comment') {
        navigation.navigate('NewsDetail', { 
          newsId: notification.referenceId,
          showComments: true
        });
      } else if (notification.type === 'like') {
        navigation.navigate('NewsDetail', { newsId: notification.referenceId });
      } else if (notification.type === 'mention') {
        navigation.navigate('NewsDetail', { 
          newsId: notification.referenceId,
          showComments: true
        });
      } else if (notification.type === 'stream') {
        navigation.navigate('StreamDetail', { streamId: notification.referenceId });
      } else if (notification.type === 'profile') {
        navigation.navigate('Profile');
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };
  
  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllAsRead(true);
      
      // Mark all as read in UI immediately for better UX
      setNotifications(prevNotifications => 
        prevNotifications.map(n => ({...n, read: true}))
      );
      
      // Send API request
      await markAllNotificationsAsRead();
      
      // Show success message
      Alert.alert(
        "Success",
        "All notifications have been marked as read.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      // Revert UI changes on error
      loadNotifications();
      
      // Show error message
      Alert.alert(
        "Error",
        "Failed to mark all notifications as read. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setSelectedFilters(newFilters);
  };
  
  // Handle settings save
  const handleSettingsSave = (newSettings) => {
    setUserSettings(newSettings);
    setShowSettings(false);
  };

  // Render empty state
  const renderEmptyComponent = () => (
    <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
      <Feather name="inbox" size={64} color={theme.border} />
      <Text style={[styles.emptyText, { color: theme.text }]}>No notifications yet</Text>
      <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
        {selectedFilters.includes('all') 
          ? "When you receive notifications, they'll appear here"
          : "No notifications match your current filters"}
      </Text>
      
      {!selectedFilters.includes('all') && (
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: theme.primary }]}
          onPress={() => setSelectedFilters(['all'])}
        >
          <Text style={styles.resetButtonText}>Reset Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Show loading indicator if loading
  if (loading && !refreshing) {
    return <LoadingIndicator />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            borderBottomColor: theme.border,
            transform: [{ scale: headerAnimation }] 
          }
        ]}
      >
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
          <View style={styles.headerActions}>
            {notifications.length > 0 && (
              <TouchableOpacity 
                onPress={handleMarkAllAsRead} 
                disabled={markingAllAsRead || notifications.every(n => n.read)}
                style={styles.headerButton}
              >
                <Text style={[
                  styles.markAllText, 
                  { color: theme.primary },
                  (markingAllAsRead || notifications.every(n => n.read)) && { opacity: 0.5 }
                ]}>
                  {markingAllAsRead ? 'Marking...' : 'Mark all read'}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => setShowSettings(true)}
            >
              <Feather name="settings" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
      
      {/* Notification Filters */}
      <NotificationFilter
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
      />
      
      {/* Notification List */}
      <FlatList
        data={filteredNotifications}
        renderItem={({ item }) => (
          <NotificationItem 
            notification={item} 
            onPress={handleNotificationPress}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContainer, 
          filteredNotifications.length === 0 && { flex: 1 }
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={renderEmptyComponent}
        onScrollBeginDrag={() => {
          Animated.timing(headerAnimation, {
            toValue: 0.98,
            duration: 200,
            useNativeDriver: true
          }).start();
        }}
        onScrollEndDrag={() => {
          Animated.timing(headerAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true
          }).start();
        }}
      />
      
      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <NotificationSettings
              initialSettings={userSettings}
              onSave={handleSettingsSave}
              onClose={() => setShowSettings(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  markAllText: {
    fontSize: 14,
    color: '#2563EB',
  },
  headerButton: {
    marginRight: 16,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 250,
  },
  resetButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 16,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
});
