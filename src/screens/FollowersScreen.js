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
 * FollowersScreen displays the list of users who follow the current user
 */
export default function FollowersScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingStatus, setFollowingStatus] = useState({});
  const [followingLoading, setFollowingLoading] = useState({});
  
  useEffect(() => {
    if (user) {
      loadFollowers();
    } else {
      navigation.replace('Auth');
    }
  }, [user]);
  
  const loadFollowers = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/user/followers');
      
      if (!response.ok) {
        throw new Error('Failed to load followers');
      }
      
      const followerData = await response.json();
      setFollowers(followerData);
      
      // Initialize following status for each user
      const statusMap = {};
      
      // We need to check if current user is following each follower
      await Promise.all(
        followerData.map(async (follower) => {
          try {
            const statusRes = await fetch(`/api/user/following/${follower.id}`);
            if (statusRes.ok) {
              const { isFollowing } = await statusRes.json();
              statusMap[follower.id] = isFollowing;
            }
          } catch (err) {
            console.error(`Error checking follow status for user ${follower.id}:`, err);
          }
        })
      );
      
      setFollowingStatus(statusMap);
    } catch (err) {
      console.error('Error loading followers:', err);
      Alert.alert('Error', 'Failed to load followers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadFollowers();
  };
  
  const handleToggleFollow = async (userId, shouldFollow) => {
    // Optimistically update UI
    setFollowingLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const endpoint = `/api/user/follow/${userId}`;
      const method = shouldFollow ? 'POST' : 'DELETE';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${shouldFollow ? 'follow' : 'unfollow'} user`);
      }
      
      // Update following status on success
      setFollowingStatus(prev => ({
        ...prev,
        [userId]: shouldFollow
      }));
    } catch (err) {
      console.error('Error toggling follow status:', err);
      Alert.alert('Error', `Failed to ${shouldFollow ? 'follow' : 'unfollow'} user. Please try again.`);
      
      // Revert optimistic update
      setFollowingStatus(prev => ({
        ...prev,
        [userId]: !shouldFollow
      }));
    } finally {
      setFollowingLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <UserList
        users={followers}
        loading={loading}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        emptyTitle="No followers yet"
        emptyMessage="When someone follows you, they'll appear here"
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