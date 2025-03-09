import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * UserProfile component for displaying a user's profile with follow functionality
 * 
 * @param {Object} props
 * @param {number} props.userId - ID of the user to display
 * @param {boolean} props.showActions - Whether to show follow/unfollow actions
 * @param {Function} props.onFollowStatusChange - Callback when follow status changes
 */
export default function UserProfile({ 
  userId, 
  showActions = true,
  onFollowStatusChange = null
}) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  useEffect(() => {
    loadUserProfile();
  }, [userId]);
  
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/user/profile/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load user profile');
      }
      
      const profileData = await response.json();
      setProfile(profileData);
      setIsFollowing(profileData.isFollowing || false);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFollow = async () => {
    if (!user) {
      navigation.navigate('Auth');
      return;
    }
    
    try {
      setFollowLoading(true);
      
      const endpoint = `/api/user/follow/${userId}`;
      const method = isFollowing ? 'DELETE' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user`);
      }
      
      const updatedIsFollowing = !isFollowing;
      setIsFollowing(updatedIsFollowing);
      
      // Update the profile's stats
      if (profile) {
        const updatedProfile = { ...profile };
        updatedProfile.stats.followers = updatedProfile.stats.followers + (updatedIsFollowing ? 1 : -1);
        setProfile(updatedProfile);
      }
      
      // Call the callback if provided
      if (onFollowStatusChange) {
        onFollowStatusChange(updatedIsFollowing);
      }
    } catch (err) {
      console.error('Error following/unfollowing user:', err);
      Alert.alert(
        'Error',
        `Failed to ${isFollowing ? 'unfollow' : 'follow'} user. Please try again.`
      );
    } finally {
      setFollowLoading(false);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundSecondary }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  
  if (error || !profile) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundSecondary }]}>
        <Text style={[styles.errorText, { color: theme.danger }]}>
          {error || 'Failed to load user profile'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={loadUserProfile}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={styles.header}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
          <Text style={styles.avatarText}>
            {profile.username.substring(0, 2).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: theme.text }]}>
            {profile.username}
          </Text>
          <Text style={[styles.joinDate, { color: theme.textSecondary }]}>
            Joined {profile.joinDate}
          </Text>
        </View>
        
        {showActions && user && user.id !== profile.id && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing 
                ? [styles.followingButton, { borderColor: theme.border }] 
                : { backgroundColor: theme.primary }
            ]}
            onPress={handleFollow}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? theme.primary : theme.buttonText} />
            ) : (
              <>
                <Feather
                  name={isFollowing ? "user-check" : "user-plus"}
                  size={16}
                  color={isFollowing ? theme.primary : theme.buttonText}
                />
                <Text
                  style={[
                    styles.followButtonText,
                    { color: isFollowing ? theme.primary : theme.buttonText }
                  ]}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {profile.stats.uploads || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Posts
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {profile.stats.followers || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Followers
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {profile.stats.following || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Following
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#64748B',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  followButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});