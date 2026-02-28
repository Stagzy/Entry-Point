import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Push Notification Service
 * Handles all push notification functionality
 */
export const notificationService = {
  
  /**
   * Initialize push notifications
   */
  async initialize() {
    try {
      console.log('🔔 Initializing push notifications...');
      
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Push notification permissions denied');
        return null;
      }
      
      // Get push token (with fallback for development)
      const token = await this.getPushToken();
      if (token) {
        console.log('✅ Push token obtained:', token.substring(0, 20) + '...');
        await this.storePushToken(token);
        return token;
      } else {
        console.log('⚠️ No push token - notifications will work locally only');
        return null;
      }
      
    } catch (error) {
      console.log('🔔 Push notification initialization error (this is normal in development):', error.message);
      console.log('📱 Local notifications will still work');
      return null;
    }
  },

  /**
   * Get push notification token
   */
  async getPushToken() {
    try {
      if (!Device.isDevice) {
        console.log('📱 Must use physical device for Push Notifications');
        // Return mock token for simulator/development
        return 'ExponentPushToken[simulator-mock-token]';
      }

      // Get project ID safely
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                       Constants.manifest?.extra?.eas?.projectId ||
                       Constants.expoConfig?.projectId ||
                       Constants.manifest?.id;

      if (!projectId) {
        console.log('⚠️ No Expo project ID found - using mock token for development');
        // Return a mock token for development
        return 'ExponentPushToken[development-mock-token]';
      }

      // Validate project ID format (should be a UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(projectId)) {
        console.log('⚠️ Invalid project ID format - using mock token for development');
        return 'ExponentPushToken[invalid-project-id-mock-token]';
      }

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })).data;
      
      return token;
    } catch (error) {
      console.log('📝 Push token error (expected in development):', error.message);
      console.log('� Using mock token - notifications will work locally');
      return 'ExponentPushToken[error-fallback-mock-token]';
    }
  },

  /**
   * Store push token locally and send to backend
   */
  async storePushToken(token) {
    try {
      // Store locally
      await AsyncStorage.setItem('pushToken', token);
      
      // In a real app, you'd send this to your backend
      console.log('💾 Push token stored:', token);
      
      // TODO: Send to backend when ready
      // await this.sendTokenToBackend(token);
    } catch (error) {
      console.error('Error storing push token:', error);
    }
  },

  /**
   * Send token to backend (implement when backend is ready)
   */
  async sendTokenToBackend(token, userId) {
    try {
      // This would send the token to your Supabase backend
      // await supabase.from('user_push_tokens').upsert({
      //   user_id: userId,
      //   push_token: token,
      //   platform: Platform.OS,
      //   updated_at: new Date().toISOString()
      // });
      console.log('🚀 Token would be sent to backend for user:', userId);
    } catch (error) {
      console.error('Error sending token to backend:', error);
    }
  },

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(title, body, data = {}, trigger = null) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: trigger || null, // null means immediate
      });
      
      console.log('📬 Local notification scheduled:', id);
      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  },

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('❌ Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  },

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🧹 All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  },

  /**
   * Send entry confirmation notification
   */
  async sendEntryConfirmation(giveawayTitle, ticketCount, giveawayId) {
    const title = '🎉 Entry Confirmed!';
    const body = `You've entered "${giveawayTitle}" with ${ticketCount} ticket${ticketCount > 1 ? 's' : ''}. Good luck!`;
    
    return await this.scheduleLocalNotification(title, body, {
      type: 'entry_confirmation',
      giveawayId,
      ticketCount
    });
  },

  /**
   * Send winner notification
   */
  async sendWinnerNotification(giveawayTitle, prize, giveawayId) {
    const title = '🏆 CONGRATULATIONS!';
    const body = `You WON "${prize}" from "${giveawayTitle}"! Check your profile for details.`;
    
    return await this.scheduleLocalNotification(title, body, {
      type: 'winner_announcement',
      giveawayId,
      prize
    });
  },

  /**
   * Send giveaway ending reminder
   */
  async sendGiveawayReminder(giveawayTitle, hoursLeft, giveawayId) {
    const title = '⏰ Giveaway Ending Soon!';
    const body = `"${giveawayTitle}" ends in ${hoursLeft} hours. Don't miss your chance!`;
    
    return await this.scheduleLocalNotification(title, body, {
      type: 'giveaway_reminder',
      giveawayId,
      hoursLeft
    });
  },

  /**
   * Send new giveaway notification
   */
  async sendNewGiveawayNotification(creatorName, giveawayTitle, giveawayId) {
    const title = '🎁 New Giveaway Alert!';
    const body = `${creatorName} just launched "${giveawayTitle}". Be the first to enter!`;
    
    return await this.scheduleLocalNotification(title, body, {
      type: 'new_giveaway',
      giveawayId,
      creatorName
    });
  },

  /**
   * Send payment success notification
   */
  async sendPaymentSuccessNotification(giveawayTitle, amount, ticketCount) {
    const title = '💳 Payment Successful!';
    const body = `Paid $${amount} for ${ticketCount} entries to "${giveawayTitle}". You're in!`;
    
    return await this.scheduleLocalNotification(title, body, {
      type: 'payment_success',
      amount,
      ticketCount
    });
  },

  /**
   * Send creator milestone notification
   */
  async sendCreatorMilestone(milestone, giveawayTitle) {
    const title = '🚀 Milestone Reached!';
    const body = `Your "${giveawayTitle}" just hit ${milestone}! Keep it up!`;
    
    return await this.scheduleLocalNotification(title, body, {
      type: 'creator_milestone',
      milestone
    });
  },

  /**
   * Schedule giveaway reminder notifications
   */
  async scheduleGiveawayReminders(giveaway) {
    try {
      const endDate = new Date(giveaway.endDate);
      const now = new Date();
      
      // Schedule reminders at different intervals
      const reminders = [
        { hours: 24, label: '24 hours' },
        { hours: 6, label: '6 hours' },
        { hours: 1, label: '1 hour' }
      ];
      
      const scheduledIds = [];
      
      for (const reminder of reminders) {
        const reminderTime = new Date(endDate.getTime() - (reminder.hours * 60 * 60 * 1000));
        
        if (reminderTime > now) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: '⏰ Giveaway Ending Soon!',
              body: `"${giveaway.title}" ends in ${reminder.label}. Last chance to enter!`,
              data: {
                type: 'giveaway_reminder',
                giveawayId: giveaway.id,
                hoursLeft: reminder.hours
              },
              sound: 'default',
            },
            trigger: {
              date: reminderTime,
            }
          });
          
          scheduledIds.push(id);
          console.log(`⏱️ Reminder scheduled for ${reminder.label} before end:`, id);
        }
      }
      
      return scheduledIds;
    } catch (error) {
      console.error('Error scheduling giveaway reminders:', error);
      return [];
    }
  },

  /**
   * Get notification settings from storage
   */
  async getNotificationSettings() {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      return settings ? JSON.parse(settings) : {
        entryConfirmations: true,
        winnerNotifications: true,
        giveawayReminders: true,
        newGiveaways: true,
        creatorUpdates: true,
        marketingNotifications: false
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {};
    }
  },

  /**
   * Save notification settings
   */
  async saveNotificationSettings(settings) {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
      console.log('💾 Notification settings saved:', settings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  },

  /**
   * Check if notifications are enabled for a specific type
   */
  async isNotificationTypeEnabled(type) {
    const settings = await this.getNotificationSettings();
    return settings[type] !== false;
  },

  /**
   * Handle notification received while app is running
   */
  addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Handle notification tapped/opened
   */
  addNotificationResponseReceivedListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  /**
   * Remove notification listeners
   */
  removeNotificationListener(subscription) {
    if (subscription) {
      subscription.remove();
    }
  },

  /**
   * Get badge count
   */
  async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  },

  /**
   * Set badge count
   */
  async setBadgeCount(count) {
    await Notifications.setBadgeCountAsync(count);
  },

  /**
   * Clear badge
   */
  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  }
};
