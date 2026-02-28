import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setIsDarkMode(colorScheme === 'dark');
      });
      
      // Set initial system theme
      setIsDarkMode(Appearance.getColorScheme() === 'dark');
      
      return () => subscription?.remove();
    }
  }, [themeMode]);

  const loadThemePreference = async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem('themeMode');
      const savedIsDarkMode = await AsyncStorage.getItem('isDarkMode');
      
      if (savedThemeMode) {
        setThemeMode(savedThemeMode);
        if (savedThemeMode === 'system') {
          setIsDarkMode(Appearance.getColorScheme() === 'dark');
        } else {
          setIsDarkMode(savedIsDarkMode === 'true');
        }
      } else {
        // Default to system theme
        setThemeMode('system');
        setIsDarkMode(Appearance.getColorScheme() === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Fallback to system theme
      setThemeMode('system');
      setIsDarkMode(Appearance.getColorScheme() === 'dark');
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (mode, darkMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      await AsyncStorage.setItem('isDarkMode', darkMode.toString());
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newDarkMode = !isDarkMode;
      setIsDarkMode(newDarkMode);
      setThemeMode('manual');
      await saveThemePreference('manual', newDarkMode);
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  const setLightTheme = async () => {
    try {
      setIsDarkMode(false);
      setThemeMode('light');
      await saveThemePreference('light', false);
    } catch (error) {
      console.error('Error setting light theme:', error);
    }
  };

  const setDarkTheme = async () => {
    try {
      setIsDarkMode(true);
      setThemeMode('dark');
      await saveThemePreference('dark', true);
    } catch (error) {
      console.error('Error setting dark theme:', error);
    }
  };

  const setSystemTheme = async () => {
    try {
      setThemeMode('system');
      const systemIsDark = Appearance.getColorScheme() === 'dark';
      setIsDarkMode(systemIsDark);
      await saveThemePreference('system', systemIsDark);
    } catch (error) {
      console.error('Error setting system theme:', error);
    }
  };

  // Light theme colors
  const lightTheme = {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#f8f9fa',
    surface: '#ffffff',
    text: '#1a1a1a',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#e0e0e0',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    gradient: ['#667eea', '#764ba2'],
    cardShadow: 'rgba(0, 0, 0, 0.1)',
    isDarkMode: false,
  };

  // Dark theme colors
  const darkTheme = {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',
    border: '#38383A',
    error: '#FF453A',
    success: '#30D158',
    warning: '#FF9F0A',
    gradient: ['#1C1C1E', '#2C2C2E'],
    cardShadow: 'rgba(0, 0, 0, 0.6)',
    isDarkMode: true,
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  // Ensure theme is always properly defined
  const safeTheme = theme || lightTheme;

  const value = {
    isDarkMode,
    themeMode,
    isSystemTheme: themeMode === 'system',
    isLoading,
    theme: safeTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
    colors: safeTheme, // For backward compatibility
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
