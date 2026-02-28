import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { notificationService } from '../services/notificationService';

/**
 * NotificationManager Component
 * Handles notification listeners and routing
 * Should be placed at the root level of the app
 */
const NotificationManager = ({ children }) => {
  const navigation = useNavigation();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Initialize notifications
    initializeNotifications();

    // Set up listeners
    setupNotificationListeners();

    // Cleanup on unmount
    return () => {
      cleanupListeners();
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      console.log('🔔 NotificationManager: Starting initialization...');
      
      const token = await notificationService.initialize();
      if (token) {
        console.log('✅ Notifications initialized successfully');
        
        // Clear badge on app start
        await notificationService.clearBadge();
        
        // DISABLED: Auto welcome notification disabled to prevent notification flood
        // Send welcome notification (only once)
        // const hasShownWelcome = await checkWelcomeNotificationShown();
        // if (!hasShownWelcome) {
        //   setTimeout(() => {
        //     notificationService.scheduleLocalNotification(
        //       '🎉 Welcome to Entry Point!',
        //       'You\'ll receive notifications for entries, wins, and updates. Tap to explore!',
        //       { type: 'welcome' }
        //     );
        //     markWelcomeNotificationShown();
        //   }, 3000);
        // }
      } else {
        console.log('⚠️ Push notifications not available - local notifications will still work');
      }
    } catch (error) {
      console.error('NotificationManager: Failed to initialize notifications:', error);
      console.log('📱 App will continue without push notifications');
    }
  };

  const setupNotificationListeners = () => {
    // DISABLED: Notification listeners disabled to prevent in-app notification flood
    console.log('🔇 Notification listeners disabled');
    return;
    
    // Listen for notifications received while app is running
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received:', notification);
        handleNotificationReceived(notification);
      }
    );

    // Listen for user tapping notifications
    responseListener.current = notificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response);
        handleNotificationResponse(response);
      }
    );
  };

  const cleanupListeners = () => {
    if (notificationListener.current) {
      notificationService.removeNotificationListener(notificationListener.current);
    }
    if (responseListener.current) {
      notificationService.removeNotificationListener(responseListener.current);
    }
  };

  const handleNotificationReceived = (notification) => {
    const { title, body, data } = notification.request.content;
    
    // Update badge count
    updateBadgeCount();
    
    // Handle specific notification types
    switch (data?.type) {
      case 'winner_announcement':
        // Play special sound or show special UI
        console.log('🏆 Winner notification received!');
        break;
      case 'giveaway_reminder':
        // Update local giveaway data
        console.log('⏰ Giveaway reminder received');
        break;
      default:
        console.log('📱 General notification received');
    }
  };

  const handleNotificationResponse = (response) => {
    const { data } = response.notification.request.content;
    
    // Clear badge when user taps notification
    notificationService.clearBadge();
    
    // Navigate based on notification type
    switch (data?.type) {
      case 'entry_confirmation':
        navigateToGiveaway(data.giveawayId);
        break;
        
      case 'winner_announcement':
        navigateToWinnerScreen(data.giveawayId);
        break;
        
      case 'giveaway_reminder':
        navigateToGiveaway(data.giveawayId);
        break;
        
      case 'new_giveaway':
        navigateToGiveaway(data.giveawayId);
        break;
        
      case 'payment_success':
        navigateToMyEntries();
        break;
        
      case 'creator_milestone':
        navigateToCreatorDashboard();
        break;
        
      case 'welcome':
        navigateToHome();
        break;
        
      default:
        // Default navigation
        navigateToHome();
    }
  };

  const navigateToGiveaway = (giveawayId) => {
    try {
      if (giveawayId && giveawayId !== 'test') {
        navigation.navigate('GiveawayDetail', { giveawayId });
      } else {
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      navigation.navigate('Home');
    }
  };

  const navigateToWinnerScreen = (giveawayId) => {
    try {
      // Show winner celebration first
      Alert.alert(
        '🏆 CONGRATULATIONS!',
        'You won a giveaway! Check your profile for prize details.',
        [
          {
            text: 'View Prize',
            onPress: () => navigateToGiveaway(giveawayId)
          },
          {
            text: 'My Wins',
            onPress: () => navigation.navigate('MyWins')
          }
        ]
      );
    } catch (error) {
      console.error('Winner navigation error:', error);
      navigation.navigate('MyWins');
    }
  };

  const navigateToMyEntries = () => {
    try {
      navigation.navigate('MyEntries');
    } catch (error) {
      console.error('Navigation error:', error);
      navigation.navigate('Home');
    }
  };

  const navigateToCreatorDashboard = () => {
    try {
      navigation.navigate('CreatorDashboard');
    } catch (error) {
      console.error('Navigation error:', error);
      navigation.navigate('Profile');
    }
  };

  const navigateToHome = () => {
    try {
      navigation.navigate('Home');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const updateBadgeCount = async () => {
    try {
      const currentCount = await notificationService.getBadgeCount();
      await notificationService.setBadgeCount(currentCount + 1);
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  };

  const checkWelcomeNotificationShown = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const shown = await AsyncStorage.getItem('welcomeNotificationShown');
      return shown === 'true';
    } catch (error) {
      return false;
    }
  };

  const markWelcomeNotificationShown = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('welcomeNotificationShown', 'true');
    } catch (error) {
      console.error('Error marking welcome notification:', error);
    }
  };

  // This component doesn't render anything visible
  return children || null;
};

export default NotificationManager;
