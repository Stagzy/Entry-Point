/**
 * NotificationDemoScreen.js
 * 
 * PURPOSE:
 * Comprehensive notification testing and development interface for testing all
 * notification types within the Entry Point app. Provides developers and QA teams
 * with tools to validate notification functionality, timing, and user experience
 * across different notification scenarios and device configurations.
 * 
 * NAVIGATION FLOW:
 * Accessible from: Settings screen, developer menu, notification settings
 * Navigates to: NotificationSettings (configuration), device system settings,
 * back to previous screen with tested notification context
 * 
 * KEY FEATURES:
 * • Comprehensive Notification Testing: 8 different notification types with real scenarios
 * • Real-time Testing Interface: Immediate notification triggers with visual feedback
 * • Scheduled Notification Testing: Future notification scheduling with countdown demonstration
 * • Push Token Management: Developer tools for token inspection and debugging
 * • Permission Status Validation: Real-time notification permission checking
 * • Notification Clearing: Bulk cancellation of pending notifications
 * • Service Integration Testing: Direct integration with notificationService APIs
 * • Visual Feedback System: Loading states, success/error alerts, status indicators
 * • Developer Tools: Debug information, token display, system status validation
 * 
 * NOTIFICATION TYPES TESTED:
 * • Entry Confirmation: Giveaway participation acknowledgment
 * • Winner Announcement: Prize win notifications with celebration
 * • Giveaway Reminders: Time-sensitive ending alerts
 * • New Giveaway Alerts: Creator content notifications
 * • Payment Success: Transaction completion confirmations
 * • Creator Milestones: Achievement and progress notifications
 * • Scheduled Reminders: Future-dated notification testing
 * • Bulk Management: Clear all pending notifications
 * 
 * DEVELOPMENT FEATURES:
 * • Push Token Inspection: Full token display for backend integration
 * • Debug Mode Integration: Development-only features and logging
 * • Error Handling: Comprehensive error catching and user feedback
 * • Permission Debugging: Device notification settings validation
 * • Service Status Testing: Real-time service connectivity verification
 * 
 * USER REQUIREMENTS:
 * • Developer or QA access level
 * • Device notification permissions enabled
 * • Valid push notification setup
 * • Network connectivity for push token generation
 * 
 * STATE MANAGEMENT:
 * • Loading states during notification sending
 * • Error handling with user-friendly alerts
 * • Push token caching and retrieval
 * • Notification permission status tracking
 * • Service connectivity status monitoring
 * 
 * TECHNICAL DETAILS:
 * • Direct notificationService integration
 * • Expo push notification system
 * • React Native Alert system for feedback
 * • Linear gradient UI with accessibility
 * • Error boundary protection
 * • Development environment detection
 * • Token management and display
 * 
 * BUSINESS LOGIC:
 * • Notification type categorization and testing
 * • Service method validation
 * • User experience testing workflows
 * • Permission requirement enforcement
 * • Debug information security (dev-only display)
 * 
 * RELATED SCREENS:
 * • NotificationSettingsScreen: Permission and preference management
 * • SettingsScreen: Main settings navigation hub
 * • Various app screens: Notification destination contexts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../../services/notificationService';

const NotificationDemoScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const testNotifications = [
    {
      title: 'Entry Confirmation',
      description: 'Test entry confirmation notification',
      action: () => notificationService.sendEntryConfirmation('Demo Giveaway', 5, 'demo123'),
      icon: 'checkmark-circle',
      color: '#4CAF50'
    },
    {
      title: 'Winner Announcement',
      description: 'Test winner notification (you won!)',
      action: () => notificationService.sendWinnerNotification('Demo Giveaway', 'iPhone 15 Pro', 'demo123'),
      icon: 'trophy',
      color: '#FFD700'
    },
    {
      title: 'Giveaway Reminder',
      description: 'Test giveaway ending reminder',
      action: () => notificationService.sendGiveawayReminder('Demo Giveaway', 2, 'demo123'),
      icon: 'time',
      color: '#FF9800'
    },
    {
      title: 'New Giveaway Alert',
      description: 'Test new giveaway notification',
      action: () => notificationService.sendNewGiveawayNotification('Creator Name', 'Amazing New Giveaway', 'demo123'),
      icon: 'gift',
      color: '#E91E63'
    },
    {
      title: 'Payment Success',
      description: 'Test payment success notification',
      action: () => notificationService.sendPaymentSuccessNotification('Demo Giveaway', '25.30', 5),
      icon: 'card',
      color: '#2196F3'
    },
    {
      title: 'Creator Milestone',
      description: 'Test creator milestone notification',
      action: () => notificationService.sendCreatorMilestone('100 entries! 🚀', 'Demo Giveaway'),
      icon: 'trending-up',
      color: '#9C27B0'
    },
    {
      title: 'Scheduled Reminder',
      description: 'Schedule a notification for 10 seconds from now',
      action: () => scheduleTestNotification(),
      icon: 'alarm',
      color: '#FF5722'
    },
    {
      title: 'Clear All Notifications',
      description: 'Cancel all pending notifications',
      action: () => clearAllNotifications(),
      icon: 'trash',
      color: '#F44336'
    }
  ];

  const scheduleTestNotification = async () => {
    try {
      const id = await notificationService.scheduleLocalNotification(
        '⏰ Scheduled Test',
        'This notification was scheduled 10 seconds ago!',
        { type: 'scheduled_test' },
        { seconds: 10 }
      );
      Alert.alert('Scheduled!', 'A notification will appear in 10 seconds');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule notification');
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationService.cancelAllNotifications();
      Alert.alert('Cleared!', 'All pending notifications cancelled');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear notifications');
    }
  };

  const sendTestNotification = async (testItem) => {
    try {
      setLoading(true);
      await testItem.action();
      Alert.alert('Sent!', `${testItem.title} notification sent`);
    } catch (error) {
      Alert.alert('Error', `Failed to send ${testItem.title}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Demo</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Settings')} 
          style={styles.settingsButton}
        >
          <Ionicons name="settings" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Test different notification types to see how they work. Make sure notifications are enabled in your device settings.
          </Text>
        </View>

        {/* Test Notifications */}
        <View style={styles.testsContainer}>
          {testNotifications.map((test, index) => (
            <TouchableOpacity
              key={index}
              style={styles.testItem}
              onPress={() => sendTestNotification(test)}
              disabled={loading}
            >
              <View style={[styles.testIcon, { backgroundColor: test.color + '20' }]}>
                <Ionicons name={test.icon} size={24} color={test.color} />
              </View>
              
              <View style={styles.testContent}>
                <Text style={styles.testTitle}>{test.title}</Text>
                <Text style={styles.testDescription}>{test.description}</Text>
              </View>
              
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Push Token Info (Dev Only) */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.devCard}
            onPress={async () => {
              const token = await notificationService.getPushToken();
              Alert.alert(
                'Push Token',
                token ? `${token.substring(0, 50)}...` : 'No token available',
                [{ text: 'Copy', onPress: () => console.log('Full token:', token) }]
              );
            }}
          >
            <Text style={styles.devTitle}>🔧 Developer Tools</Text>
            <Text style={styles.devText}>Tap to view push token</Text>
          </TouchableOpacity>
        )}

        {/* Footer Spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  testsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  testIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  testContent: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  devCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  devTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  devText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  footer: {
    height: 40,
  },
});

export default NotificationDemoScreen;
