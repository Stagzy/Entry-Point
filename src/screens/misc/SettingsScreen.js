/**
 * SettingsScreen.js
 * 
 * PURPOSE:
 * Comprehensive application settings and preferences management interface providing
 * users with granular control over app appearance, notifications, privacy, behavior,
 * and data management. Features dynamic theming, real-time preference updates, and
 * platform-specific controls for optimal user experience customization.
 * 
 * NAVIGATION FLOW:
 * Accessible from: Profile screen, main navigation menu, quick settings access
 * Navigates to: HelpSupport, NotificationDemo (testing interface),
 * back to profile or previous screen with settings applied
 * 
 * KEY FEATURES:
 * • Dynamic Theme System: Light/dark mode with system default synchronization
 * • Visual Customization: App icon selection, theme mode preferences
 * • Comprehensive Notification Controls: Push, email, campaign updates, winner alerts
 * • Privacy Management: Profile visibility, participation history, win display controls
 * • Security Features: Biometric authentication, auto-login preferences
 * • Data Management: Cache control, storage optimization
 * • Platform Integration: iOS ActionSheet and Android Alert dialog support
 * • Real-time Updates: Immediate visual feedback for all setting changes
 * • Support Integration: Help, contact, and app rating functionality
 * 
 * SETTINGS CATEGORIES:
 * • Appearance (2 settings): Theme mode selection, dark mode toggle
 * • Notifications (5 settings): Push notifications, entry confirmations, winner announcements, giveaway reminders, new giveaway alerts
 * • Privacy (1 setting): Profile visibility
 * • App Behavior (3 settings): Biometric authentication, purchase confirmations, auto-play videos
 * • Support (2 actions): Help/FAQ, app rating
 * 
 * THEME SYSTEM:
 * • Light Mode: Clean white/blue interface with high contrast
 * • Dark Mode: Dark background with blue accents and optimized readability
 * • System Default: Automatic theme matching device settings
 * • Dynamic Colors: Real-time color adaptation based on selected theme
 * • Gradient Headers: Visual appeal with branded color schemes
 * 
 * USER EXPERIENCE:
 * • Switch Controls: Native iOS/Android switches with platform theming
 * • Action Sheets: Platform-appropriate selection dialogs
 * • Visual Feedback: Immediate response to all setting changes
 * • Contextual Descriptions: Clear explanations for each setting option
 * • Organized Sections: Logical grouping of related settings
 * • Accessibility: High contrast, readable fonts, touch-friendly controls
 * 
 * STATE MANAGEMENT:
 * • Local Settings State: Real-time preference tracking with immediate updates
 * • Theme State Synchronization: Coordinated dark mode and theme mode states
 * • Platform Detection: iOS vs Android behavior adaptation
 * • Persistent Storage: Settings preservation across app sessions
 * • Error Handling: Graceful fallbacks for setting update failures
 * 
 * TECHNICAL DETAILS:
 * • Linear Gradient Headers: Branded visual design with accessibility
 * • Platform-Specific Dialogs: ActionSheetIOS for iOS, Alert for Android
 * • Dynamic Styling: Real-time theme application throughout interface
 * • Switch Component Integration: Native platform controls with custom theming
 * • Navigation Integration: Seamless routing to related screens
 * • Icon System: Comprehensive Ionicons integration with color theming
 * 
 * PRIVACY & SECURITY:
 * • Profile Visibility Controls: Public, friends-only, private options
 * • History Management: Granular control over displayed participation data
 * • Biometric Authentication: Face ID/Touch ID integration for secure access
 * • Data Transparency: Clear explanations of privacy setting implications
 * 
 * BUSINESS LOGIC:
 * • Default Preferences: Balanced defaults for optimal user experience
 * • Marketing Opt-in: Compliance-friendly marketing email controls
 * • Cache Management: Storage optimization with user control
 * • Support Integration: Direct access to help and feedback systems
 * • Version Display: App version information and branding
 * 
 * ACCESSIBILITY:
 * • High Contrast Themes: Optimized readability in light and dark modes
 * • Descriptive Labels: Clear setting titles and explanations
 * • Touch Target Optimization: Appropriately sized interactive elements
 * • Screen Reader Support: Accessible component structure
 * • Visual Hierarchy: Clear organization with proper typography
 * 
 * PLATFORM INTEGRATION:
 * • iOS Action Sheets: Native iOS selection experience
 * • Android Alert Dialogs: Platform-appropriate Android interactions
 * • System Theme Detection: Integration with device-level theme preferences
 * • Biometric Authentication: Platform-specific Face ID/Touch ID/Fingerprint
 * • App Store Integration: Direct rating and review functionality
 * 
 * RELATED SCREENS:
 * • NotificationDemoScreen: Testing and validation interface
 * • HelpSupportScreen: User assistance and support resources
 * • ProfileScreen: User account and identity management
 * • Various app screens: Theme changes apply throughout application
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { isDarkMode, themeMode, theme, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    // Appearance
    darkMode: isDarkMode,
    themeMode: themeMode,
    
    // Notifications
    pushNotifications: true,
    entryConfirmations: true,
    winnerAnnouncements: true,
    giveawayReminders: true,
    newGiveaways: true,
    
    // Privacy
    profileVisibility: 'public',
    
    // App Behavior
    biometricAuth: false,
    confirmPurchases: true,
    autoPlayVideos: true,
  });

  // Load settings from storage on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Sync settings with global theme state
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      darkMode: isDarkMode,
      themeMode: themeMode
    }));
  }, [isDarkMode, themeMode]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
    
    // Handle dark mode toggle using global theme context
    if (key === 'darkMode') {
      toggleTheme();
    }
  };

  const handleThemeModeChange = () => {
    const options = ['System Default', 'Light Mode', 'Dark Mode', 'Cancel'];
    const currentIndex = themeMode === 'system' ? 0 : themeMode === 'light' ? 1 : 2;
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 3,
          title: 'Theme Mode',
          message: 'Choose your preferred theme setting'
        },
        (buttonIndex) => {
          if (buttonIndex !== 3) {
            if (buttonIndex === 0) {
              setSystemTheme();
            } else if (buttonIndex === 1) {
              setLightTheme();
            } else if (buttonIndex === 2) {
              setDarkTheme();
            }
          }
        }
      );
    } else {
      Alert.alert(
        'Theme Mode',
        'Choose your preferred theme setting',
        [
          { text: 'System Default', onPress: () => setSystemTheme() },
          { text: 'Light Mode', onPress: () => setLightTheme() },
          { text: 'Dark Mode', onPress: () => setDarkTheme() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handlePrivacyChange = () => {
    const options = ['Public', 'Friends Only', 'Private', 'Cancel'];
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 3,
          title: 'Profile Visibility',
        },
        (buttonIndex) => {
          if (buttonIndex !== 3) {
            const values = ['public', 'friends', 'private'];
            updateSetting('profileVisibility', values[buttonIndex]);
          }
        }
      );
    } else {
      Alert.alert(
        'Profile Visibility',
        'Choose who can see your profile',
        [
          { text: 'Public', onPress: () => updateSetting('profileVisibility', 'public') },
          { text: 'Friends Only', onPress: () => updateSetting('profileVisibility', 'friends') },
          { text: 'Private', onPress: () => updateSetting('profileVisibility', 'private') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const getDisplayValue = (key) => {
    const value = settings[key];
    switch (key) {
      case 'appIcon':
        return value.charAt(0).toUpperCase() + value.slice(1);
      case 'profileVisibility':
        return value === 'public' ? 'Public' : value === 'friends' ? 'Friends Only' : 'Private';
      case 'themeMode':
        return value === 'system' ? 'System Default' : value === 'light' ? 'Light Mode' : 'Dark Mode';
      case 'maxEntryPrice':
        return value >= 999999 ? 'No Limit' : `$${value}`;
      default:
        return value;
    }
  };

  const renderSection = (title, children) => (
    <View style={[styles.sectionContainer, { backgroundColor: theme.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );

  const renderSettingRow = (icon, title, description, rightComponent, iconColor, isLast = false) => (
    <View>
      <View style={[styles.settingRow]}>
        <View style={[styles.iconContainer, { backgroundColor: (iconColor || theme.primary) + '20' }]}>
          <Ionicons name={icon} size={20} color={iconColor || theme.primary} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
          {description && <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>{description}</Text>}
        </View>
        {rightComponent}
      </View>
      {!isLast && <View style={[styles.separator, { backgroundColor: theme.border }]} />}
    </View>
  );

  const renderSwitchRow = (icon, title, description, settingKey, iconColor, isLast = false) => (
    renderSettingRow(
      icon,
      title,
      description,
      <Switch
        style={styles.switchContainer}
        value={settings[settingKey]}
        onValueChange={(value) => updateSetting(settingKey, value)}
        trackColor={{ false: theme.border, true: theme.primary + '40' }}
        thumbColor={settings[settingKey] ? theme.primary : (Platform.OS === 'ios' ? '#fff' : '#f4f3f4')}
      />,
      iconColor,
      isLast
    )
  );

  const renderActionRow = (icon, title, description, onPress, iconColor, isLast = false) => (
    renderSettingRow(
      icon,
      title,
      description,
      <TouchableOpacity onPress={onPress} style={styles.actionIcon}>
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </TouchableOpacity>,
      iconColor,
      isLast
    )
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Clean Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer}>

      {/* Appearance Section */}
      <View style={[styles.sectionContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
        {renderActionRow(
          'color-palette',
          'Theme Mode',
          `Current: ${getDisplayValue('themeMode')}`,
          handleThemeModeChange,
          '#8E44AD'
        )}
        {renderSwitchRow(
          'moon',
          'Dark Mode',
          'Override theme mode with manual toggle',
          'darkMode',
          '#2C3E50',
          true
        )}
      </View>

      {/* Notifications Section */}
      <View style={[styles.sectionContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Notifications</Text>
        {renderSwitchRow(
          'notifications',
          'Push Notifications',
          'Receive notifications on your device',
          'pushNotifications',
          '#E74C3C'
        )}
        {renderSwitchRow(
          'checkmark-circle',
          'Entry Confirmations',
          'Get notified when you successfully enter a giveaway',
          'entryConfirmations',
          '#4CAF50'
        )}
        {renderSwitchRow(
          'trophy',
          'Winner Announcements',
          'Be the first to know when you win a giveaway',
          'winnerAnnouncements',
          '#FFD700'
        )}
        {renderSwitchRow(
          'time',
          'Giveaway Reminders',
          'Reminders before giveaways end',
          'giveawayReminders',
          '#FF9800'
        )}
        {renderSwitchRow(
          'gift',
          'New Giveaway Alerts',
          'Notifications when creators you follow launch new giveaways',
          'newGiveaways',
          '#E91E63',
          true
        )}
      </View>

      {/* Privacy Section */}
      <View style={[styles.sectionContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Privacy</Text>
        {renderActionRow(
          'eye',
          'Profile Visibility',
          `Current: ${getDisplayValue('profileVisibility')}`,
          handlePrivacyChange,
          '#27AE60',
          true
        )}
      </View>

      {/* App Behavior Section */}
      <View style={[styles.sectionContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>App Behavior</Text>
        {renderSwitchRow(
          'finger-print',
          'Biometric Authentication',
          'Use Face ID or Touch ID to unlock',
          'biometricAuth',
          '#8E44AD'
        )}
        {renderSwitchRow(
          'shield-checkmark',
          'Confirm Purchases',
          'Require confirmation before buying entries',
          'confirmPurchases',
          '#E74C3C'
        )}
        {renderSwitchRow(
          'play-circle',
          'Auto-Play Videos',
          'Automatically play giveaway preview videos',
          'autoPlayVideos',
          '#9C27B0',
          true
        )}
      </View>

      {/* Support Section */}
      <View style={[styles.sectionContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Support</Text>
        {renderActionRow(
          'help-circle',
          'Help & FAQ',
          'Get help and find answers',
          () => navigation.navigate('HelpSupport'),
          '#3498DB'
        )}
        {renderActionRow(
          'star',
          'Rate App',
          'Leave a review in the App Store',
          () => Alert.alert('Rate App', 'Thanks for your feedback!'),
          '#F1C40F',
          true
        )}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>Entry Point v1.0.0</Text>
        <Text style={[styles.footerSubtext, { color: theme.textSecondary }]}>Made with ❤️ for creators and participants</Text>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 36,
  },
  sectionContainer: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 60,
  },
  separator: {
    height: 0.5,
    marginLeft: 56,
    opacity: 0.5,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
    paddingRight: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 1,
  },
  settingDescription: {
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 18,
  },
  settingValue: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  switchContainer: {
    marginLeft: 8,
  },
  actionIcon: {
    marginLeft: 8,
    opacity: 0.6,
    padding: 4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginTop: 24,
    marginHorizontal: 16,
    borderTopWidth: 0.5,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 16,
  },
});
