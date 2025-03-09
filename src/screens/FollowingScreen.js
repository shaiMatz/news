import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import UserList from '../components/UserList';

/**
 * FollowingScreen displays the list of users the current user is following
 */
export default function FollowingScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState({});
  
  useEffect(() => {
    if (user) {
      loadFollowing();
    } else {
      navigation.replace('Auth');
    }
  }, [user]);
  
  const loadFollowing = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/user/following');
      
      if (!response.ok) {
        throw new Error('Failed to load following users');
      }
      
      const followingData = await response.json();
      setFollowing(followingData);
      
      // Initialize following status (all are true since this is a following list)
      const statusMap = {};
      followingData.forEach(user => {
        statusMap[user.id] = true;
      });
      
      // No need to check status since we know they are all being followed
    } catch (err) {
      console.error('Error loading following users:', err);
      Alert.alert('Error', 'Failed to load following users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadFollowing();
  };
  
  const handleToggleFollow = async (userId, shouldFollow) => {
    // Since this is the following list, shouldFollow will always be false (unfollowing)
    if (shouldFollow) return; // Safety check
    
    // Optimistically update UI
    setFollowingLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await fetch(`/api/user/follow/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to unfollow user');
      }
      
      // Remove user from list on success
      setFollowing(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      console.error('Error unfollowing user:', err);
      Alert.alert('Error', 'Failed to unfollow user. Please try again.');
    } finally {
      setFollowingLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  // Create a map for following status (all true since this is a following list)
  const followingStatus = following.reduce((acc, user) => {
    acc[user.id] = true;
    return acc;
  }, {});
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <UserList
        users={following}
        loading={loading}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        emptyTitle="Not following anyone"
        emptyMessage="When you follow users, they'll appear here"
        onToggleFollow={handleToggleFollow}
        followingStatus={followingStatus}
        followingLoading={followingLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
});