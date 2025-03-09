import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { scheduleLocalNotification } from '../services/notifications';

/**
 * NotificationTester component for testing push notifications
 * 
 * @param {Object} props
 * @param {Function} props.onClose - Function to close the tester
 */
export default function NotificationTester({ onClose }) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [notificationType, setNotificationType] = useState('news');
  
  // Available notification types with their icons and colors
  const notificationTypes = [
    { id: 'news', label: 'News', icon: 'file-text', color: theme.primary },
    { id: 'like', label: 'Like', icon: 'heart', color: theme.danger },
    { id: 'comment', label: 'Comment', icon: 'message-circle', color: theme.success },
    { id: 'mention', label: 'Mention', icon: 'at-sign', color: '#7C3AED' },
    { id: 'stream', label: 'Stream', icon: 'video', color: '#F59E0B' },
    { id: 'system', label: 'System', icon: 'settings', color: theme.textSecondary },
  ];
  
  // Send a test notification
  const sendTestNotification = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please enter both a title and message for the notification');
      return;
    }
    
    try {
      setLoading(true);
      
      const notificationId = await scheduleLocalNotification({
        title,
        body: message,
        data: {
          type: notificationType,
          referenceId: 1, // Mock reference ID
          referenceType: notificationType
        }
      }, 1); // Show after 1 second
      
      if (notificationId) {
        Alert.alert(
          'Success', 
          'Test notification sent successfully! You should receive it shortly.',
          [{ text: 'OK' }]
        );
        
        // Reset form after successful send
        setTitle('');
        setMessage('');
      } else {
        Alert.alert(
          'Error',
          'Failed to send test notification. Please check notification permissions.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert(
        'Error',
        'An error occurred while sending the test notification.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Test Notifications</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Notification Type</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeContainer}
        >
          {notificationTypes.map((type) => {
            const isSelected = notificationType === type.id;
            
            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  { borderColor: type.color },
                  isSelected && { backgroundColor: type.color }
                ]}
                onPress={() => setNotificationType(type.id)}
              >
                <Feather 
                  name={type.icon} 
                  size={16} 
                  color={isSelected ? '#FFFFFF' : type.color} 
                />
                <Text 
                  style={[
                    styles.typeLabel,
                    { color: isSelected ? '#FFFFFF' : theme.text }
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Notification Content</Text>
        
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Title</Text>
          <TextInput
            style={[
              styles.input,
              { 
                color: theme.text,
                backgroundColor: theme.isDark ? theme.backgroundSecondary : '#F8FAFC',
                borderColor: theme.border
              }
            ]}
            placeholder="Notification title"
            placeholderTextColor={theme.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Message</Text>
          <TextInput
            style={[
              styles.textArea,
              { 
                color: theme.text,
                backgroundColor: theme.isDark ? theme.backgroundSecondary : '#F8FAFC',
                borderColor: theme.border,
                textAlignVertical: 'top'
              }
            ]}
            placeholder="Notification message"
            placeholderTextColor={theme.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
          />
        </View>
        
        <View style={styles.notificationPreview}>
          <Text style={[styles.previewTitle, { color: theme.textSecondary }]}>Preview</Text>
          <View style={[
            styles.previewContent,
            { 
              backgroundColor: theme.isDark ? theme.backgroundSecondary : '#EFF6FF',
              borderColor: theme.border
            }
          ]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.appName, { color: theme.text }]}>NewsGeo</Text>
              <Text style={[styles.previewTime, { color: theme.textMuted }]}>now</Text>
            </View>
            <Text style={[styles.previewNotifTitle, { color: theme.text }]}>
              {title || 'Notification Title'}
            </Text>
            <Text style={[styles.previewMessage, { color: theme.textSecondary }]} numberOfLines={2}>
              {message || 'Notification message will appear here'}
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: theme.primary }]}
          onPress={sendTestNotification}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="send" size={18} color="#FFFFFF" style={styles.sendIcon} />
              <Text style={styles.sendButtonText}>Send Test Notification</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1E293B',
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 6,
    color: '#64748B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
    fontSize: 16,
    minHeight: 100,
  },
  notificationPreview: {
    marginTop: 16,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 14,
    marginBottom: 8,
    color: '#64748B',
  },
  previewContent: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#EFF6FF',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  previewTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  previewNotifTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1E293B',
  },
  previewMessage: {
    fontSize: 14,
    color: '#334155',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sendButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sendIcon: {
    marginRight: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});