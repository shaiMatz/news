import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Banner component to encourage users to sign up for premium features
 */
export default function PremiumBanner() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const handleSignUpPress = () => {
    navigation.navigate('Auth');
  };

  const bannerBackground = theme.isDark 
    ? 'rgba(37, 99, 235, 0.2)' 
    : '#EFF6FF';

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: bannerBackground,
        shadowColor: theme.shadow
      }
    ]}>
      <View style={styles.iconContainer}>
        <Feather name="alert-circle" size={24} color={theme.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[
          styles.title,
          { color: theme.isDark ? theme.primary : '#1E40AF' }
        ]}>
          Viewing Limited Content
        </Text>
        <Text style={[
          styles.message,
          { color: theme.isDark ? theme.textSecondary : '#3B82F6' }
        ]}>
          Sign in to unlock all news, sharing, and more.
        </Text>
      </View>
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={handleSignUpPress}
      >
        <Text style={styles.buttonText}>Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 2,
  },
  message: {
    color: '#3B82F6',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
