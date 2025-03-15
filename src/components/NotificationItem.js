import React, { memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalizationContext } from '../contexts/LocalizationContext';
import useLocalization from '../hooks/useLocalization';
import { formatRelativeTime } from '../utils/timeUtils';

/**
 * NotificationItem component for displaying a single notification
 * 
 * @param {Object} props
 * @param {Object} props.notification - The notification data
 * @param {Function} props.onPress - Function to handle pressing the notification
 */
const NotificationItem = ({ notification, onPress }) => {
  const { theme } = useTheme();
  const { t } = useLocalization();
  const { isRTL, getDirectionStyle, getTextAlignStyle } = useLocalizationContext();
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'news':
        return <Feather name="file-text" size={24} color={theme.primary} />;
      case 'like':
        return <Feather name="heart" size={24} color={theme.danger} />;
      case 'comment':
        return <Feather name="message-circle" size={24} color={theme.success} />;
      case 'mention':
        return <Feather name="at-sign" size={24} color="#7C3AED" />;
      case 'stream':
        return <Feather name="video" size={24} color="#F59E0B" />;
      case 'profile':
        return <Feather name="user" size={24} color="#7C3AED" />;
      case 'system':
        return <Feather name="settings" size={24} color={theme.textSecondary} />;
      default:
        return <Feather name="bell" size={24} color={theme.textSecondary} />;
    }
  };
  
  // Apply priority styling (if applicable)
  const getPriorityStyles = () => {
    if (notification.priority === 'high') {
      return {
        backgroundColor: theme.isDark 
          ? 'rgba(220, 38, 38, 0.15)' 
          : 'rgba(254, 226, 226, 0.7)'
      };
    }
    return {};
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        getDirectionStyle(),
        { 
          borderBottomColor: theme.border,
          backgroundColor: theme.background 
        },
        !notification.read && { 
          backgroundColor: theme.isDark 
            ? theme.backgroundSecondary 
            : '#F1F5F9' 
        },
        getPriorityStyles()
      ]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer, 
        isRTL ? { marginLeft: 16, marginRight: 0 } : { marginRight: 16 },
        { backgroundColor: theme.isDark ? theme.backgroundSecondary : '#EFF6FF' }
      ]}>
        {getNotificationIcon(notification.type)}
      </View>
      
      <View style={[
        styles.notificationContent,
        isRTL ? { marginLeft: 8, marginRight: 0 } : { marginRight: 8 }
      ]}>
        <Text 
          style={[
            styles.notificationTitle, 
            getTextAlignStyle(),
            { color: theme.text },
            !notification.read && { fontWeight: '700' }
          ]}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text 
          style={[
            styles.notificationMessage, 
            getTextAlignStyle(),
            { color: theme.textSecondary }
          ]}
          numberOfLines={2}
        >
          {notification.message}
        </Text>
        <Text style={[
          styles.notificationTime, 
          getTextAlignStyle(),
          { color: theme.textMuted }
        ]}>
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>
      
      {!notification.read && (
        <View style={[
          styles.unreadIndicator, 
          isRTL ? { marginRight: 8, marginLeft: 0 } : { marginLeft: 8 },
          { backgroundColor: theme.primary }
        ]} />
      )}
      
      {notification.actionable && (
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            isRTL ? { marginRight: 8, marginLeft: 0 } : { marginLeft: 8 },
            { backgroundColor: theme.primary }
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onPress({ ...notification, action: true });
          }}
        >
          <Text style={[styles.actionButtonText, getTextAlignStyle()]}>
            {notification.actionText ? t(notification.actionText) : t('common.view')}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  actionButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

// Use memo to prevent unnecessary re-renders
export default memo(NotificationItem);