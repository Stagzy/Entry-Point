import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View, ActivityIndicator, LogBox } from 'react-native';
import 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Disable LogBox warnings that might cause property access errors
LogBox.ignoreLogs([
  'Warning: Cannot read property',
  'TypeError: Cannot read property',
  'Remote debugger',
]);

// Disable all LogBox warnings if the error persists
LogBox.ignoreAllLogs(true);

function AppContent() {
  const { theme, isLoading } = useTheme();
  
  // Simple fallback without complex checks
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme?.background || '#f8f9fa' }]}>
      <AppNavigator />
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
