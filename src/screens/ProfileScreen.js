import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Switch 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLocalizationContext } from '../contexts/LocalizationContext';
import { fetchUserProfile, updateUserSettings, fetchUserContent } from '../services/api';
import LoadingIndicator from '../components/LoadingIndicator';
import NewsCard from '../components/NewsCard';
import LanguageSelector from '../components/LanguageSelector';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { t } = useTranslation(); // Add translation hook
  const { isRTL, getDirectionStyle, getTextAlignStyle } = useLocalizationContext(); // Add localization context
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userContent, setUserContent] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('uploads');
  const [settings, setSettings] = useState({
    locationTracking: true,
    notifications: true,
    contentLanguage: 'English',
  });

  useEffect(() => {
    loadProfileData();
    loadUserContent();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const data = await fetchUserProfile();
      setProfile(data);
      
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const loadUserContent = async () => {
    try {
      setContentLoading(true);
      const content = await fetchUserContent();
      setUserContent(content);
    } catch (error) {
      console.error('Failed to load user content:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const handleSettingChange = async (key, value) => {
    try {
      const updatedSettings = { ...settings, [key]: value };
      setSettings(updatedSettings);
      await updateUserSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      Alert.alert('Error', 'Failed to update settings');
      // Revert the setting if the update failed
      setSettings(settings);
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, getDirectionStyle()]}>
        <View style={[styles.profileInfo, getDirectionStyle()]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View>
            <Text style={[styles.username, getTextAlignStyle()]}>
              {user?.username || 'User'}
            </Text>
            <Text style={[styles.joinDate, getTextAlignStyle()]}>
              {t('profile.memberSince', { date: profile?.joinDate || t('common.recently') })}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={[styles.logoutButton, getDirectionStyle()]} onPress={handleLogout}>
          <Feather name="log-out" size={18} color="#64748B" />
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.statsContainer, getDirectionStyle()]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.stats?.uploads || 0}</Text>
          <Text style={styles.statLabel}>{t('profile.uploads')}</Text>
        </View>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => navigation.navigate('Followers')}
        >
          <Text style={styles.statValue}>{profile?.stats?.followers || 0}</Text>
          <Text style={styles.statLabel}>{t('profile.followers')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => navigation.navigate('Following')}
        >
          <Text style={styles.statValue}>{profile?.stats?.following || 0}</Text>
          <Text style={styles.statLabel}>{t('profile.following')}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, getTextAlignStyle()]}>
          {t('profile.settings')}
        </Text>
        <View style={styles.settingsContainer}>
          <View style={[styles.settingItem, getDirectionStyle()]}>
            <View>
              <Text style={[styles.settingLabel, getTextAlignStyle()]}>
                {t('profile.locationTracking')}
              </Text>
              <Text style={[styles.settingDescription, getTextAlignStyle()]}>
                {t('profile.locationTrackingDescription')}
              </Text>
            </View>
            <Switch
              value={settings.locationTracking}
              onValueChange={(value) => handleSettingChange('locationTracking', value)}
              trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
              thumbColor={settings.locationTracking ? '#2563EB' : '#F9FAFB'}
            />
          </View>
          
          <View style={styles.settingDivider} />
          
          <View style={[styles.settingItem, getDirectionStyle()]}>
            <View>
              <Text style={[styles.settingLabel, getTextAlignStyle()]}>
                {t('profile.pushNotifications')}
              </Text>
              <Text style={[styles.settingDescription, getTextAlignStyle()]}>
                {t('profile.pushNotificationsDescription')}
              </Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => handleSettingChange('notifications', value)}
              trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
              thumbColor={settings.notifications ? '#2563EB' : '#F9FAFB'}
            />
          </View>
          
          <View style={styles.settingDivider} />
          
          <View style={[styles.settingItem, getDirectionStyle()]}>
            <View>
              <Text style={[styles.settingLabel, getTextAlignStyle()]}>
                {t('profile.language')}
              </Text>
              <Text style={[styles.settingDescription, getTextAlignStyle()]}>
                {t('profile.languageDescription')}
              </Text>
            </View>
            <LanguageSelector showLabel={false} type="dropdown" />
          </View>
        </View>
      </View>
      
      <View style={styles.contentSection}>
        <View style={[styles.tabsContainer, getDirectionStyle()]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'uploads' && styles.activeTab]}
            onPress={() => setActiveTab('uploads')}
          >
            <Text style={[
              styles.tabText, 
              activeTab === 'uploads' && styles.activeTabText,
              getTextAlignStyle()
            ]}>
              {t('profile.myUploads')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'liked' && styles.activeTab]}
            onPress={() => setActiveTab('liked')}
          >
            <Text style={[
              styles.tabText, 
              activeTab === 'liked' && styles.activeTabText,
              getTextAlignStyle()
            ]}>
              {t('profile.likedContent')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {contentLoading ? (
          <LoadingIndicator size="small" />
        ) : userContent.length > 0 ? (
          <View style={styles.contentGrid}>
            {userContent
              .filter(item => activeTab === 'uploads' ? item.isUploaded : item.isLiked)
              .map(item => (
                <View key={item.id} style={styles.contentItem}>
                  <NewsCard news={item} compact />
                </View>
              ))}
          </View>
        ) : (
          <View style={styles.emptyContent}>
            <Feather name={activeTab === 'uploads' ? 'upload' : 'heart'} size={48} color="#E2E8F0" />
            <Text style={styles.emptyContentText}>
              {activeTab === 'uploads' 
                ? t('profile.noUploadsYet')
                : t('profile.noLikesYet')}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  joinDate: {
    fontSize: 14,
    color: '#64748B',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  logoutText: {
    marginHorizontal: 6,
    color: '#64748B',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statItem: {
    flex: 1,
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  settingsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748B',
    maxWidth: 250,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  contentSection: {
    padding: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 16,
    color: '#64748B',
  },
  activeTabText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  contentItem: {
    width: '50%',
    padding: 8,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyContentText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
  },
});
