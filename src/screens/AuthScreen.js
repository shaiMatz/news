import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import useLocalization from '../hooks/useLocalization';
import LanguageSelector from '../components/LanguageSelector';

export default function AuthScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { safeT, getContainerStyle, getDirectionStyle, getTextAlignStyle } = useLocalization();

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  }, [user, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={[styles.twoColumnLayout, getContainerStyle()]}>
            <View style={styles.formColumn}>
              <View style={[styles.headerSection, getDirectionStyle()]}>
                <Text style={[styles.logo, getTextAlignStyle()]}>NewsGeo</Text>
                <LanguageSelector type="inline" showLabel={false} />
              </View>
              <Text style={[styles.subtitle, getTextAlignStyle()]}>{safeT('auth.subtitle')}</Text>
              <AuthForm />
            </View>
            
            <View style={styles.heroColumn}>
              <View style={styles.heroContent}>
                <Feather name="map-pin" size={48} color="#2563EB" style={styles.heroIcon} />
                <Text style={[styles.heroTitle, getTextAlignStyle()]}>{safeT('auth.hero.title')}</Text>
                <Text style={[styles.heroText, getTextAlignStyle()]}>
                  {safeT('auth.hero.description')}
                </Text>
                
                <View style={[styles.featureRow, getDirectionStyle()]}>
                  <View style={styles.featureItem}>
                    <Feather name="video" size={24} color="#2563EB" />
                    <Text style={[styles.featureTitle, getTextAlignStyle()]}>{safeT('auth.features.streaming')}</Text>
                  </View>
                  
                  <View style={styles.featureItem}>
                    <Feather name="bell" size={24} color="#2563EB" />
                    <Text style={[styles.featureTitle, getTextAlignStyle()]}>{safeT('auth.features.notifications')}</Text>
                  </View>
                  
                  <View style={styles.featureItem}>
                    <Feather name="upload" size={24} color="#2563EB" />
                    <Text style={[styles.featureTitle, getTextAlignStyle()]}>{safeT('auth.features.upload')}</Text>
                  </View>
                </View>
                
                <TouchableOpacity style={[styles.exploreButton, getDirectionStyle()]}>
                  <Text style={[styles.exploreButtonText, getTextAlignStyle()]}>{safeT('auth.exploreFeatures')}</Text>
                  <Feather name="arrow-right" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  twoColumnLayout: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  formColumn: {
    flex: 1,
    minWidth: 300,
    padding: 24,
    justifyContent: 'center',
  },
  heroColumn: {
    flex: 1,
    minWidth: 300,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 32,
  },
  heroContent: {
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
  },
  heroIcon: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureTitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  exploreButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
});
