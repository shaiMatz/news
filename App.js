import React from 'react';
import { Text, View, StyleSheet, Button, SafeAreaView, StatusBar } from 'react-native';

/**
 * Main App component for the React Native client
 */
export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerText}>NewsGeo</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to NewsGeo</Text>
        <Text style={styles.subtitle}>Your hyper-local news platform</Text>
        
        <View style={styles.featureBox}>
          <Text style={styles.featureTitle}>Key Features:</Text>
          <Text style={styles.featureItem}>• Location-based news delivery</Text>
          <Text style={styles.featureItem}>• Real-time updates via WebSockets</Text>
          <Text style={styles.featureItem}>• Follow users and topics</Text>
          <Text style={styles.featureItem}>• Share news with your community</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Log In" 
            onPress={() => alert('Login functionality will be implemented soon!')} 
          />
          <View style={styles.buttonSpacer} />
          <Button 
            title="Sign Up" 
            onPress={() => alert('Sign up functionality will be implemented soon!')} 
            color="#2ecc71" 
          />
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>NewsGeo © 2025</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3498db',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  featureBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  featureItem: {
    fontSize: 16,
    marginBottom: 10,
    color: '#444',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  buttonSpacer: {
    width: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: '#34495e',
    alignItems: 'center',
  },
  footerText: {
    color: 'white',
    fontSize: 14,
  },
});