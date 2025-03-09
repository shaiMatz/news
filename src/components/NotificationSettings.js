import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { updateUserSettings } from '../services/api';

/**
 * NotificationSettings component for managing notification preferences
 * 
 * @param {Object} props
 * @param {Object} props.initialSettings - Initial notification settings
 * @param {Function} props.onSave - Callback when settings are saved
 * @param {Function} props.onClose - Callback to close settings panel
 */
export default function NotificationSettings({ initialSettings = {}, onSave, onClose }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    enablePushNotifications: true,
    enableNewsNotifications: true,
    enableLikeNotifications: true,
    enableCommentNotifications: true,
    enableMentionNotifications: true,
    enableStreamNotifications: true,
    ...initialSettings
  });

  const handleToggleSetting = (setting) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      [setting]: !prevSettings[setting]
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      // Send updated settings to the server
      await updateUserSettings({ notificationSettings: settings });
      
      // Call the onSave callback with the updated settings
      if (onSave) {
        onSave(settings);
      }
      
      Alert.alert(
        "Success",
        "Notification settings updated successfully",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert(
        "Error",
        "Failed to update notification settings. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const NotificationOption = ({ label, value, settingKey, icon }) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
      <View style={styles.settingLabelContainer}>
        <View style={[styles.iconContainer, { backgroundColor: theme.isDark ? theme.backgroundSecondary : '#EFF6FF' }]}>
          <Feather name={icon} size={20} color={theme.primary} />
        </View>
        <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={() => handleToggleSetting(settingKey)}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={value ? (theme.isDark ? '#FFFFFF' : '#FFFFFF') : theme.isDark ? '#888' : '#F1F5F9'}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Notification Settings</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <NotificationOption
          label="Push Notifications"
          value={settings.enablePushNotifications}
          settingKey="enablePushNotifications"
          icon="bell"
        />
        
        <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Notify me about
          </Text>
        </View>
        
        <NotificationOption
          label="News Updates"
          value={settings.enableNewsNotifications}
          settingKey="enableNewsNotifications"
          icon="file-text"
        />
        
        <NotificationOption
          label="Likes"
          value={settings.enableLikeNotifications}
          settingKey="enableLikeNotifications"
          icon="heart"
        />
        
        <NotificationOption
          label="Comments"
          value={settings.enableCommentNotifications}
          settingKey="enableCommentNotifications"
          icon="message-circle"
        />
        
        <NotificationOption
          label="Mentions"
          value={settings.enableMentionNotifications}
          settingKey="enableMentionNotifications"
          icon="at-sign"
        />
        
        <NotificationOption
          label="Live Streams"
          value={settings.enableStreamNotifications}
          settingKey="enableStreamNotifications"
          icon="video"
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSaveSettings}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Settings</Text>
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
  sectionHeader: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1E293B',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});