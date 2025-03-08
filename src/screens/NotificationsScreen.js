import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fetchNotifications, markNotificationAsRead } from '../services/api';
import { formatRelativeTime } from '../utils/timeUtils';
import LoadingIndicator from '../components/LoadingIndicator';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const loadNotifications = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const fetchedNotifications = await fetchNotifications();
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleRefresh = () => {
    loadNotifications(true);
  };

  const handleNotificationPress = async (notification) => {
    try {
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
      } else if (notification.type === 'profile') {
        navigation.navigate('Profile');
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        {getNotificationIcon(item.type)}
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{formatRelativeTime(item.createdAt)}</Text>
      </View>
      
      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'news':
        return <Feather name="file-text" size={24} color="#2563EB" />;
      case 'like':
        return <Feather name="heart" size={24} color="#EF4444" />;
      case 'comment':
        return <Feather name="message-circle" size={24} color="#10B981" />;
      case 'profile':
        return <Feather name="user" size={24} color="#7C3AED" />;
      default:
        return <Feather name="bell" size={24} color="#64748B" />;
    }
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Feather name="inbox" size={64} color="#E2E8F0" />
      <Text style={styles.emptyText}>No notifications yet</Text>
      <Text style={styles.emptySubtext}>
        When you receive notifications, they'll appear here
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return <LoadingIndicator />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={() => console.log('Mark all as read')}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  unreadNotification: {
    backgroundColor: '#F1F5F9',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
    marginLeft: 8,
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
});
