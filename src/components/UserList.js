import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { formatRelativeTime } from '../utils/timeUtils';

/**
 * UserList component for displaying a list of users with follow/unfollow functionality
 * 
 * @param {Object} props
 * @param {Array} props.users - Array of user objects to display
 * @param {boolean} props.loading - Whether the list is loading
 * @param {string} props.emptyTitle - Title to show when list is empty
 * @param {string} props.emptyMessage - Message to show when list is empty
 * @param {Function} props.onRefresh - Function to call when the list should be refreshed
 * @param {boolean} props.refreshing - Whether the list is currently refreshing
 * @param {Function} props.onToggleFollow - Function to call when follow/unfollow is pressed
 * @param {Object} props.followingStatus - Object mapping user IDs to their following status
 * @param {Object} props.followingLoading - Object mapping user IDs to whether follow action is loading
 */
export default function UserList({ 
  users = [], 
  loading = false,
  emptyTitle = 'No users found',
  emptyMessage = 'Try again later',
  onRefresh = null,
  refreshing = false,
  onToggleFollow = null,
  followingStatus = {},
  followingLoading = {}
}) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const renderUserItem = ({ item }) => {
    const isFollowing = followingStatus[item.id] || false;
    const isLoading = followingLoading[item.id] || false;
    
    return (
      <TouchableOpacity
        style={[styles.userItem, { backgroundColor: theme.backgroundSecondary }]}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
        activeOpacity={0.7}
      >
        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
          <Text style={styles.avatarText}>
            {item.username.substring(0, 2).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: theme.text }]}>
            {item.username}
          </Text>
          
          {item.followingSince && (
            <Text style={[styles.followingSince, { color: theme.textSecondary }]}>
              Following since {formatRelativeTime(item.followingSince)}
            </Text>
          )}
          
          {item.stats && (
            <Text style={[styles.stats, { color: theme.textSecondary }]}>
              {item.stats.uploads || 0} posts • {item.stats.followers || 0} followers
            </Text>
          )}
        </View>
        
        {onToggleFollow && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing 
                ? [styles.followingButton, { borderColor: theme.border }]
                : { backgroundColor: theme.primary }
            ]}
            onPress={() => onToggleFollow(item.id, !isFollowing)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? theme.primary : theme.buttonText} />
            ) : (
              <>
                <Feather
                  name={isFollowing ? "user-check" : "user-plus"}
                  size={14}
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
      </TouchableOpacity>
    );
  };
  
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  
  if (users.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="users" size={48} color={theme.textMuted} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          {emptyTitle}
        </Text>
        <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
          {emptyMessage}
        </Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={users}
      renderItem={renderUserItem}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={styles.listContent}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  followingSince: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  stats: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
    minWidth: 90,
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  followButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    minHeight: 200,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
});