import React, { useState, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { AuthProvider } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import AppNavigator from './navigation/AppNavigator';
import { StatusBar, useColorScheme, View } from 'react-native';
import NetworkStatusBanner from './components/NetworkStatusBanner';
import { pingServer } from './utils/connectivityUtils';

/**
 * Main application content component
 * This is wrapped by the ThemeProvider to access theme context
 */
function AppContent() {
  const { theme, isDarkMode } = useTheme();
  const [forceRefresh, setForceRefresh] = useState(false);
  
  // Handler for network retry attempt
  const handleNetworkRetry = useCallback(async () => {
    setForceRefresh(true);
    const serverReachable = await pingServer();
    setForceRefresh(false);
    return serverReachable;
  }, []);
  
  // Create custom navigation theme
  const navigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
    },
  };
  
  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.background} 
      />
      <View style={{ flex: 1 }}>
        <NetworkStatusBanner onRetry={handleNetworkRetry} />
        <AuthProvider>
          <LocationProvider>
            <NavigationContainer theme={navigationTheme}>
              <AppNavigator />
            </NavigationContainer>
          </LocationProvider>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}

/**
 * Main application component
 * Wraps the entire app with necessary providers and navigation
 */
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
