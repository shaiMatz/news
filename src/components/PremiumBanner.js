import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

/**
 * Banner component to encourage users to sign up for premium features
 */
export default function PremiumBanner() {
  const navigation = useNavigation();

  const handleSignUpPress = () => {
    navigation.navigate('Auth');
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name="alert-circle" size={24} color="#2563EB" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          Viewing Limited Content
        </Text>
        <Text style={styles.message}>
          Sign in to unlock all news, sharing, and more.
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.button}
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
