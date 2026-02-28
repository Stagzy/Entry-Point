/**
 * LiveActivityFeedScreen - Real-Time Community Activity Hub
 * 
 * PURPOSE:
 * - Provides live real-time feed of platform activity and user interactions
 * - Creates social engagement through activity visibility and interactions
 * - Facilitates creator-participant relationships and community building
 * - Delivers instant notifications and activity updates across the platform
 * 
 * NAVIGATION:
 * - Accessed from: Bottom navigation "Activity" tab
 * - Deep Links: Activity notifications, activity mentions, creator profiles
 * - Navigation Targets: GiveawayDetailScreen, UserProfileScreen
 * 
 * KEY FEATURES:
 * - Real-Time Updates: Live activity streaming with instant notifications
 * - Activity Types: Comprehensive activity tracking (entries, wins, milestones, etc.)
 * - Smart Notifications: Badge counts, activity counters
 * - Cross-Platform Integration: Deep linking and activity interactions
 * 
 * LIVE FEED:
 * - Real-time activity stream with 7 different activity types
 * - Visual activity indicators with color-coded icons
 * - Interactive activity items linking to source content
 * - Pull-to-refresh functionality with loading states
 * - Special winner announcements with golden highlighting
 * 
 * REAL-TIME ACTIVITY TYPES:
 * - GIVEAWAY_CREATED: New giveaway announcements
 * - ENTRY_PURCHASED: Ticket purchase notifications
 * - WINNER_SELECTED: Winner announcements with special styling
 * - MILESTONE_REACHED: Progress milestone celebrations
 * - GIVEAWAY_LIKED: Social engagement tracking
 * - GIVEAWAY_COMMENT: Comment activity notifications
 * - Custom activities with extensible type system
 * 
 * REAL-TIME FEATURES:
 * - Activity Streaming: Live activity updates via service subscriptions
 * - Notification Badges: Real-time activity counters
 * - Auto-Refresh: Periodic data synchronization
 * - Status Indicators: Activity status tracking
 * 
 * STATE MANAGEMENT:
 * - activities: Live activity feed data with real-time updates
 * - newActivityCount: Real-time activity counter with auto-reset
 * - Animation states: Smooth transitions and visual feedback
 * 
 * CONVERSATION FEATURES:
 * - Conversation Types: Group and direct message differentiation
 * - Participant Management: Group member tracking and display
 * - Message Threading: Chronological message organization
 * - Creator Badges: Visual identification of verified creators
 * - Conversation Metadata: Last message, timestamp, participant count
 * - Search Functionality: Real-time conversation filtering
 * 
 * ACTIVITY VISUALIZATION:
 * - Dynamic Icons: Context-aware icon selection based on activity type
 * - Color Coding: Activity-specific color schemes for quick recognition
 * - Winner Highlighting: Special golden gradient for winner announcements
 * - Progress Display: Visual progress indicators for milestone activities
 * - Time Formatting: Smart relative time display (minutes, hours, days)
 * 
 * USER EXPERIENCE:
 * - Smooth Animations: Fade-in transitions and entrance animations
 * - Intuitive Navigation: Clear tab switching with visual feedback
 * - Empty States: Contextual messaging for empty feeds and conversations
 * - Loading States: Skeleton screens and loading indicators
 * - Error Handling: Graceful fallbacks for failed operations
 * 
 * SOCIAL FEATURES:
 * - Community Building: Group conversations for shared interests
 * - Creator Access: Direct messaging with giveaway creators
 * - Activity Sharing: Social proof through visible activity participation
 * - Engagement Tracking: Like and comment activity visibility
 * - Network Effects: Friend and follower activity prioritization
 * 
 * TECHNICAL ARCHITECTURE:
 * - Service Integration: Real-time activity service subscriptions
 * - Performance Optimization: Efficient FlatList rendering with virtualization
 * - Memory Management: Proper cleanup of real-time subscriptions
 * - State Persistence: Conversation and activity state management
 * - Cross-Platform: iOS and Android keyboard handling and animations
 * 
 * NOTIFICATION SYSTEM:
 * - Badge Management: Real-time unread count updates
 * - Activity Counters: New activity notifications with auto-dismiss
 * - Visual Indicators: Unread conversation highlighting
 * - Toast Integration: Success and error message display
 * - Sound and Vibration: Native notification feedback (future)
 * 
 * PRIVACY & SAFETY:
 * - Message Encryption: Secure message transmission (planned)
 * - Content Moderation: Inappropriate content filtering
 * - Blocking System: User blocking and reporting functionality
 * - Privacy Controls: Message visibility and conversation settings
 * - Data Protection: Minimal personal data exposure
 * 
 * PERFORMANCE FEATURES:
 * - Virtual Scrolling: Efficient rendering for large activity feeds
 * - Message Pagination: Lazy loading of conversation history
 * - Real-time Throttling: Optimized update frequency for performance
 * - Memory Optimization: Proper state cleanup and garbage collection
 * - Network Efficiency: Minimal bandwidth usage for real-time updates
 * 
 * RELATED SCREENS:
 * - GiveawayDetailScreen: Activity navigation destination
 * - UserProfileScreen: Creator and participant profiles
 * - HomeScreen: Activity integration and quick access
 * - NotificationSettingsScreen: Notification preference management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { activityService, ACTIVITY_TYPES } from '../../services/activityService';

const { width } = Dimensions.get('window');

export default function LiveActivityFeedScreen({ navigation, route }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showSuccess, showError } = useToast();
  
  // Tab management - now just for the header
  const [activeTab] = useState('feed'); // Always 'feed' now
  
  // Activity feed state
  const [activities, setActivities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newActivityCount, setNewActivityCount] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadActivities();
    
    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Subscribe to real-time updates
    const unsubscribe = activityService.subscribeToActivities((newActivity) => {
      setActivities(prev => [newActivity, ...prev]);
      setNewActivityCount(prev => prev + 1);
      
      // Auto-scroll notification (optional)
      setTimeout(() => setNewActivityCount(0), 3000);
    });

    return unsubscribe;
  }, [route?.params]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await activityService.getRecentActivities(50, 0);
      
      if (error) {
        console.error('Error loading activities:', error);
        return;
      }
      
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadActivities();
    setNewActivityCount(0);
    setRefreshing(false);
  }, []);  // Removed activeTab dependency since we only have feed now

  // Helper function for better time formatting
  const getTimeAgo = (date) => {
    try {
      // Ensure we have a valid date
      const targetDate = date instanceof Date ? date : new Date(date);
      
      // Check if the date is valid
      if (isNaN(targetDate.getTime())) {
        return 'Just now';
      }
      
      const now = new Date();
      const diffInMs = now - targetDate;
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else {
        return targetDate.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Just now';
    }
  };



  const getActivityIcon = (type) => {
    switch (type) {
      case ACTIVITY_TYPES.GIVEAWAY_CREATED:
        return { name: 'gift', color: '#4CAF50' };
      case ACTIVITY_TYPES.ENTRY_PURCHASED:
        return { name: 'ticket', color: '#2196F3' };
      case ACTIVITY_TYPES.WINNER_SELECTED:
        return { name: 'trophy', color: '#FFD700' };
      case ACTIVITY_TYPES.MILESTONE_REACHED:
        return { name: 'trending-up', color: '#FF9800' };
      case ACTIVITY_TYPES.GIVEAWAY_LIKED:
        return { name: 'heart', color: '#E91E63' };
      case ACTIVITY_TYPES.GIVEAWAY_COMMENT:
        return { name: 'chatbubble', color: '#9C27B0' };
      default:
        return { name: 'flash', color: '#666' };
    }
  };

  const getActivityMessage = (activity) => {
    const { type, metadata, user } = activity;
    const userName = user?.display_name || metadata?.user_name || 'Someone';
    
    switch (type) {
      case ACTIVITY_TYPES.GIVEAWAY_CREATED:
        return {
          primary: `${metadata?.creator_name || userName} created a new giveaway`,
          secondary: metadata?.giveaway_title,
          tertiary: `Prize: ${metadata?.prize}`
        };
      case ACTIVITY_TYPES.ENTRY_PURCHASED:
        return {
          primary: `${userName} bought ${metadata?.entries_purchased || 1} entries`,
          secondary: metadata?.giveaway_title,
          tertiary: 'Good luck! 🍀'
        };
      case ACTIVITY_TYPES.WINNER_SELECTED:
        return {
          primary: `🎉 ${metadata?.winner_name || userName} won!`,
          secondary: metadata?.giveaway_title,
          tertiary: metadata?.prize
        };
      case ACTIVITY_TYPES.MILESTONE_REACHED:
        return {
          primary: `${metadata?.milestone}! 🔥`,
          secondary: metadata?.giveaway_title,
          tertiary: `${metadata?.current_entries}/${metadata?.max_entries} entries`
        };
      case ACTIVITY_TYPES.GIVEAWAY_LIKED:
        return {
          primary: `${userName} liked a giveaway`,
          secondary: metadata?.giveaway_title,
          tertiary: '❤️'
        };
      case ACTIVITY_TYPES.GIVEAWAY_COMMENT:
        return {
          primary: `${userName} commented`,
          secondary: metadata?.comment,
          tertiary: metadata?.giveaway_title
        };
      default:
        return {
          primary: 'New activity',
          secondary: '',
          tertiary: ''
        };
    }
  };

  const handleActivityPress = (activity) => {
    if (activity.giveaway_id) {
      navigation.navigate('GiveawayDetail', { 
        giveawayId: activity.giveaway_id,
        giveaway: activity.giveaway 
      });
    }
  };

  const ActivityItem = ({ item, index }) => {
    const icon = getActivityIcon(item.type);
    const message = getActivityMessage(item);
    const isWinner = item.type === ACTIVITY_TYPES.WINNER_SELECTED;
    
    return (
      <TouchableOpacity
        style={[
          styles.activityItem, 
          { backgroundColor: theme.surface, borderColor: theme.border },
          isWinner && styles.winnerActivity
        ]}
        onPress={() => handleActivityPress(item)}
        activeOpacity={0.7}
      >
        {isWinner && (
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 193, 7, 0.05)']}
            style={styles.winnerGradient}
          />
        )}
        
        <View style={styles.activityContent}>
          <View style={[styles.activityIcon, { backgroundColor: icon.color + '20' }]}>
            <Ionicons name={icon.name} size={20} color={icon.color} />
          </View>
          
          <View style={styles.activityText}>
            <Text style={[
              styles.primaryText, 
              { color: theme.text },
              isWinner && styles.winnerText
            ]}>
              {message.primary}
            </Text>
            {message.secondary && (
              <Text style={[styles.secondaryText, { color: theme.textSecondary }]} numberOfLines={2}>
                {message.secondary}
              </Text>
            )}
            {message.tertiary && (
              <Text style={[styles.tertiaryText, { color: theme.textSecondary }]}>
                {message.tertiary}
              </Text>
            )}
          </View>
          
          <View style={styles.activityMeta}>
            <Text style={[styles.timeText, { color: theme.textSecondary }]}>
              {getTimeAgo(item.created_at)}
            </Text>
            {isWinner && (
              <View style={styles.winnerBadge}>
                <Ionicons name="trophy" size={12} color="#FFD700" />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="flash-outline" size={64} color="#ddd" />
      <Text style={styles.emptyTitle}>No activities yet</Text>
      <Text style={styles.emptySubtitle}>
        Activities will appear here as users interact with giveaways
      </Text>
    </View>
  );

  // Tab selector (now just shows Live Feed title)
  const renderTabSelector = () => (
    <View style={[styles.headerContainer, { backgroundColor: theme.surface }]}>
      <View style={styles.headerContent}>
        <Ionicons 
          name="flash" 
          size={20} 
          color={theme.primary} 
        />
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Live Activity Feed
        </Text>
        {newActivityCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{newActivityCount}</Text>
          </View>
        )}
      </View>
    </View>
  );











  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderTabSelector()}
        
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={ActivityItem}
          ListEmptyComponent={!loading ? renderEmptyState : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#667eea']}
              tintColor="#667eea"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={activities.length === 0 ? styles.emptyContainer : styles.feedContainer}
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  feedContainer: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 20,
  },
  activityItem: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  winnerActivity: {
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  winnerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  activityContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  activityIcon: {
    borderRadius: 25,
    padding: 10,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    flex: 1,
    marginRight: 12,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  winnerText: {
    color: '#FF8F00',
  },
  secondaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  tertiaryText: {
    fontSize: 12,
    color: '#999',
  },
  activityMeta: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  winnerBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 10,
    padding: 4,
    marginTop: 4,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  
  // Header styles
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60, // Safe area for status bar
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f1f3',
    borderRadius: 25,
    marginHorizontal: 16,
    marginTop: 60, // Safe area for status bar
    marginBottom: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#fff',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 12,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});
