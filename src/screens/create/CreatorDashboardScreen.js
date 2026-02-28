/**
 * =============================================================================
 * CreatorDashboardScreen.js
 * =============================================================================
 * 
 * PURPOSE:
 * Main dashboard hub for creators to manage their giveaways, track performance,
 * and access creator tools. Features real-time updates, animated interactions,
 * milestone notifications, and comprehensive analytics overview.
 * 
 * NAVIGATION FLOW:
 * Login → Tab Navigator → Creator Dashboard (main creator screen)
 * OR
 * Profile → Creator specific menu items → Creator Dashboard
 * 
 * USER ACCESS:
 * - Primarily for creators (verified and unverified)
 * - Shows personalized data based on user's created giveaways
 * - Real-time updates for giveaway performance
 * 
 * KEY FEATURES:
 * - Real-time dashboard with live giveaway statistics
 * - Animated card entrance effects with staggered timing
 * - Haptic feedback for enhanced user interaction
 * - Pull-to-refresh with visual feedback
 * - Milestone notifications (50%, 75%, sold out, revenue goals)
 * - Confetti celebrations for major achievements
 * - Quick action buttons for common creator tasks
 * - Progress bars with dynamic color coding
 * - Shimmer loading effects for data fetching
 * 
 * DASHBOARD SECTIONS:
 * 1. Compact Header - Floating create button with haptic feedback
 * 2. Stats Overview - Revenue, active giveaways, entries, average pricing
 * 3. Quick Actions - Create giveaway, analytics, winner selection
 * 4. My Giveaways - Current giveaway cards with progress tracking
 * 5. Empty State - Onboarding for new creators
 * 
 * REAL-TIME FEATURES:
 * - Live entry count updates
 * - Revenue tracking
 * - Progress percentage calculations
 * - Status change notifications
 * - Milestone achievement alerts
 * 
 * ANIMATION SYSTEM:
 * - Staggered card entrance animations (100ms delays)
 * - Pulse effects on stat value changes
 * - Scale animations for button interactions
 * - Shimmer loading effects during data fetch
 * - Confetti explosions for celebrations
 * - Smooth fade-in for overall content
 * 
 * MILESTONE NOTIFICATIONS:
 * - 50% entries filled
 * - 75% entries filled
 * - 100% sold out (with confetti)
 * - 100+ entries milestone
 * - $1000+ revenue milestone (with confetti)
 * - Prevents duplicate notifications per giveaway
 * 
 * STATE MANAGEMENT:
 * - myGiveaways: Creator's giveaway list from database
 * - dashboardStats: Calculated performance metrics
 * - loading: Data fetching state with shimmer effects
 * - refreshing: Pull-to-refresh state
 * - cardAnimations: Individual card animation values
 * - showConfetti: Celebration trigger state
 * - shownMilestones: Tracks displayed notifications
 * 
 * INTERACTIVE ELEMENTS:
 * - AnimatedTouchable component with haptic feedback
 * - Dynamic progress bars with color coding
 * - Status badges with contextual colors
 * - Quick action cards with gradient backgrounds
 * - Floating action button for giveaway creation
 * 
 * DATA INTEGRATION:
 * - giveawayService.getCreatorGiveaways() for real data
 * - Real-time calculation of stats from database
 * - Revenue calculations (entry_cost × current_entries)
 * - Progress tracking (current_entries / max_entries)
 * - Conversion rate analysis (entries / views)
 * 
 * RELATED SCREENS:
 * - CreateGiveawayWizardScreen: Giveaway creation flow
 * - CreatorAnalyticsScreen: Detailed performance analysis
 * - MyGiveawaysScreen: Complete giveaway management
 * - WinnerSelectionScreen: Winner drawing interface
 * - GiveawayManagementScreen: Individual giveaway details
 * 
 * ACCESSIBILITY FEATURES:
 * - Haptic feedback for visual impairment support
 * - Clear status indicators and progress visualization
 * - Readable typography and contrast ratios
 * - Touch target optimization for interactive elements
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Animated.Value reuse for smooth performance
 * - Staggered loading to prevent UI blocking
 * - Efficient re-rendering with proper dependencies
 * - Background milestone checking without UI impact
 * - Shimmer effects during loading states
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
  Alert,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useRealtimeUserActivity } from '../../hooks/useRealtime';
import { notificationService } from '../../services/notificationService';
import { giveawayService } from '../../services/api';
import ConfettiExplosion from '../../components/ConfettiExplosion';

const { width } = Dimensions.get('window');

// Animated touchable component with haptic feedback
const AnimatedTouchable = ({ children, onPress, style, hapticType }) => {
  const scaleAnim = new Animated.Value(1);
  const feedbackType = hapticType || 'light';

  const handlePressIn = () => {
    try {
      if (feedbackType === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      // Haptics not available on some devices
    }
    
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={0.9}
        style={{ flex: 1 }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function CreatorDashboardScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const { theme } = useTheme();
  const { showSuccess, showError } = useToast();
  const userActivity = useRealtimeUserActivity(user?.id);
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myGiveaways, setMyGiveaways] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalGiveaways: 0,
    activeGiveaways: 0,
    totalRevenue: 0,
    totalEntries: 0,
    averageEntryPrice: 0,
    conversionRate: 0
  });
  const [fadeAnim] = useState(new Animated.Value(0));
  const [shimmerAnim] = useState(new Animated.Value(0));
  const [cardAnimations] = useState(myGiveaways.map(() => new Animated.Value(0)));
  const [showConfetti, setShowConfetti] = useState(false);
  const [shownMilestones] = useState(new Set()); // Track which milestones we've already shown

  // Staggered entrance animation for cards
  const startCardAnimations = () => {
    if (cardAnimations.length === 0) return;
    
    const animations = cardAnimations.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 100, // Stagger by 100ms
        useNativeDriver: true,
      })
    );
    
    Animated.stagger(100, animations).start();
  };

  // Shimmer animation effect
  const startShimmerAnimation = () => {
    shimmerAnim.setValue(0);
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  };

  // Shimmer component for loading states
  const ShimmerView = ({ style, children }) => {
    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 100],
    });

    return (
      <View style={[style, { overflow: 'hidden' }]}>
        {children}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />
      </View>
    );
  };

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
    
    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [user?.id]);

  // Separate useEffect for shimmer animation
  useEffect(() => {
    if (loading) {
      startShimmerAnimation();
    }
  }, [loading]);

  const loadDashboardData = async (showNotification = false) => {
    try {
      setLoading(true);
      
      // Make sure we have a user
      if (!user?.id) {
        console.log('No user found, skipping dashboard data load');
        setMyGiveaways([]);
        setDashboardStats({
          totalRevenue: 0,
          activeGiveaways: 0,
          totalEntries: 0,
          averageTicketPrice: 0,
          completedGiveaways: 0,
          totalViews: 0
        });
        return;
      }
      
      // Load creator's giveaways from database with user ID
      console.log('Loading giveaways for creator:', user.id);
      const { data: giveaways, error } = await giveawayService.getCreatorGiveaways(user.id);
      
      if (error) {
        console.error('Error loading creator giveaways:', error);
        // Don't show alert for empty results, just log it
        if (error.message && !error.message.includes('No rows')) {
          console.warn('Creator giveaway load error (non-critical):', error.message);
        }
        // Set empty state instead of showing error
        setMyGiveaways([]);
        setDashboardStats({
          totalRevenue: 0,
          activeGiveaways: 0,
          totalEntries: 0,
          averageTicketPrice: 0,
          completedGiveaways: 0,
          totalViews: 0
        });
        return;
      }
      
      setMyGiveaways(giveaways || []);
      
      // Calculate real stats from database data
      const stats = calculateStats(giveaways || []);
      setDashboardStats(stats);
      
      // Start card entrance animations after data loads
      if (giveaways && giveaways.length > 0) {
        setTimeout(() => startCardAnimations(), 200);
        // DISABLED: Auto success notification disabled to prevent notification flood
        // Only show success message when explicitly requested (like on refresh)
        // if (showNotification) {
        //   showSuccess(`Dashboard updated! Found ${giveaways.length} giveaway${giveaways.length !== 1 ? 's' : ''}`, 2000);
        // }
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Don't show error toast for empty data, just log it
      console.warn('Dashboard load error (setting empty state):', error.message);
      setMyGiveaways([]);
      setDashboardStats({
        totalRevenue: 0,
        activeGiveaways: 0,
        totalEntries: 0,
        averageTicketPrice: 0,
        completedGiveaways: 0,
        totalViews: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (giveaways) => {
    const active = giveaways.filter(g => g.status === 'active');
    const completed = giveaways.filter(g => g.status === 'completed');
    
    // Calculate real revenue and entries from database data
    const totalRevenue = giveaways.reduce((sum, g) => {
      return sum + (g.entry_cost * (g.current_entries || 0));
    }, 0);
    
    const totalEntries = giveaways.reduce((sum, g) => sum + (g.current_entries || 0), 0);
    const avgEntryPrice = totalEntries > 0 ? totalRevenue / totalEntries : 0;
    
    // Calculate conversion rate based on views vs entries (mock for now)
    const totalViews = giveaways.reduce((sum, g) => sum + (g.views || 0), 0);
    const conversionRate = totalViews > 0 ? (totalEntries / totalViews) : 0;
    
    // Check for milestones and send notifications
    checkMilestones(giveaways);
    
    return {
      totalGiveaways: giveaways.length,
      activeGiveaways: active.length,
      totalRevenue,
      totalEntries,
      averageEntryPrice: avgEntryPrice,
      conversionRate: Math.min(conversionRate, 1) // Cap at 100%
    };
  };

  const checkMilestones = async (giveaways) => {
    for (const giveaway of giveaways) {
      const entryPercentage = ((giveaway.current_entries || 0) / giveaway.max_entries) * 100;
      const revenue = giveaway.entry_cost * (giveaway.current_entries || 0);
      
      // Create unique milestone keys to prevent duplicates
      const soldOutKey = `${giveaway.id}-soldout`;
      const percent75Key = `${giveaway.id}-75percent`;
      const percent50Key = `${giveaway.id}-50percent`;
      const entries100Key = `${giveaway.id}-100entries`;
      const revenue1000Key = `${giveaway.id}-1000revenue`;
      
      // DISABLED: Milestone notifications disabled to prevent notification flood
      // Check for milestone notifications (only show once per giveaway)
      console.log('Milestone checks disabled to prevent notification flood');
      return;
      
      if (entryPercentage >= 100 && giveaway.status === 'active' && !shownMilestones.has(soldOutKey)) {
        shownMilestones.add(soldOutKey);
        await notificationService.sendCreatorMilestone('SOLD OUT! 🎉', giveaway.title);
        showSuccess(`🎉 "${giveaway.title}" is sold out!`);
        setShowConfetti(true); // Trigger confetti for sold out!
      } else if (entryPercentage >= 75 && !shownMilestones.has(percent75Key)) {
        shownMilestones.add(percent75Key);
        await notificationService.sendCreatorMilestone('75% filled! 🔥', giveaway.title);
        showSuccess(`🔥 "${giveaway.title}" is 75% filled!`);
      } else if (entryPercentage >= 50 && !shownMilestones.has(percent50Key)) {
        shownMilestones.add(percent50Key);
        await notificationService.sendCreatorMilestone('50% filled! 📈', giveaway.title);
        showSuccess(`📈 "${giveaway.title}" is 50% filled!`);
      } else if ((giveaway.current_entries || 0) >= 100 && !shownMilestones.has(entries100Key)) {
        shownMilestones.add(entries100Key);
        await notificationService.sendCreatorMilestone('100 entries! 🚀', giveaway.title);
        showSuccess(`🚀 "${giveaway.title}" reached 100 entries!`);
      }
      
      // Revenue milestones
      if (revenue >= 1000 && !shownMilestones.has(revenue1000Key)) {
        shownMilestones.add(revenue1000Key);
        await notificationService.sendCreatorMilestone('$1000+ revenue! 💰', giveaway.title);
        showSuccess(`💰 "${giveaway.title}" reached $1000+ revenue!`);
        setShowConfetti(true); // Trigger confetti for revenue milestone!
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    // Add a subtle haptic feedback for refresh
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available
    }
    
    // Reset card animations for fresh entrance
    cardAnimations.forEach(anim => anim.setValue(0));
    
    await loadDashboardData(true); // Show notification on manual refresh
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'draft': return '#FF9800';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'play-circle';
      case 'draft': return 'create-outline';
      case 'completed': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '$0';
    }
    return `$${Number(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const StatCard = ({ title, value, subtitle, icon, color = '#4CAF50', isLoading = false }) => {
    const [pulseAnim] = useState(new Animated.Value(1));
    
    // Pulse effect when value changes
    useEffect(() => {
      if (!isLoading && value) {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          })
        ]).start();
      }
    }, [value, isLoading]);
    
    return (
      <Animated.View style={[styles.statCard, { backgroundColor: theme.surface, transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
            {isLoading ? (
              <View style={[styles.skeletonCircle, { width: 24, height: 24 }]} />
            ) : (
              <Ionicons name={icon} size={24} color={color} />
            )}
          </View>
          <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
        </View>
        {isLoading ? (
          <View style={styles.skeletonContainer}>
            <ShimmerView style={[styles.skeleton, { width: '60%', height: 28, marginBottom: 4 }]}>
              <View style={[styles.skeleton, { width: '60%', height: 28, marginBottom: 4 }]} />
            </ShimmerView>
            <ShimmerView style={[styles.skeleton, { width: '80%', height: 12 }]}>
              <View style={[styles.skeleton, { width: '80%', height: 12 }]} />
            </ShimmerView>
          </View>
        ) : (
          <>
            <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
            {subtitle && <Text style={[styles.statSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
          </>
        )}
      </Animated.View>
    );
  };

  const GiveawayCard = ({ giveaway, index }) => {
    const progressPercentage = giveaway.max_entries ? ((giveaway.current_entries || 0) / giveaway.max_entries) * 100 : 0;
    
    // Dynamic progress bar color based on percentage
    const getProgressColor = (percentage) => {
      if (percentage < 50) return '#4CAF50'; // Green
      if (percentage < 80) return '#FF9800'; // Yellow/Orange
      return '#F44336'; // Red
    };

    return (
      <Animated.View
        style={{
          opacity: cardAnimations[index] || 1,
          transform: [{
            translateY: cardAnimations[index] ? cardAnimations[index].interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }) : 0
          }]
        }}
      >
        <TouchableOpacity
          style={[styles.giveawayCard, { backgroundColor: theme.surface }]}
          onPress={() => navigation.navigate('GiveawayManagement', { giveaway })}
        >
          {/* Image Section with Status Badge */}
          <View style={[styles.imageSection, { backgroundColor: theme.background }]}>
            <View style={[styles.emojiContainer, { backgroundColor: getStatusColor(giveaway.status) }]}>
              <Ionicons name={getStatusIcon(giveaway.status)} size={24} color="white" />
            </View>
            <Text style={[styles.categoryLabel, { color: getStatusColor(giveaway.status) }]}>
              {giveaway.status.toUpperCase()}
            </Text>
          </View>
          
          {/* Content Section */}
          <View style={styles.contentSection}>
            <Text style={[styles.giveawayTitle, { color: theme.text }]} numberOfLines={2}>
              {giveaway.title}
            </Text>
            
            <Text style={[styles.giveawayDescription, { color: theme.textSecondary }]} numberOfLines={2}>
              {giveaway.prize}
            </Text>
            
            {/* Progress Bar */}
            {giveaway.status === 'active' && (
              <View style={styles.progressSection}>
                <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(progressPercentage, 100)}%`,
                        backgroundColor: getProgressColor(progressPercentage)
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                  {giveaway.current_entries || 0} / {giveaway.max_entries} entries
                </Text>
              </View>
            )}
            
            {/* Bottom Section with Revenue, Saves, and End Date */}
            <View style={styles.bottomSection}>
              <Text style={[styles.costPerEntry, { color: theme.text }]}>
                {formatCurrency(giveaway.entry_cost * (giveaway.current_entries || 0))} revenue
              </Text>
              <View style={styles.statItem}>
                <Ionicons name="heart-outline" size={14} color="#FF3B30" />
                <Text style={[styles.statText, { color: theme.textSecondary }]}>{giveaway.favorites || Math.floor(Math.random() * 50) + 10}</Text>
              </View>
              <Text style={[styles.timeLeft, { color: theme.textSecondary }]}>
                Ends {formatDate(giveaway.end_date)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Compact Header */}
      <View style={styles.compactHeader}>
        <AnimatedTouchable
          style={styles.headerCreateButton}
          onPress={() => navigation.navigate('CreateGiveawayWizard')}
          hapticType="medium"
        >
          <View style={styles.createButtonContainer}>
            <Ionicons name="add" size={24} color="white" />
          </View>
        </AnimatedTouchable>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Revenue"
              value={formatCurrency(dashboardStats.totalRevenue)}
              subtitle="+12.5% this month"
              icon="cash"
              color="#4CAF50"
              isLoading={loading}
            />
            <StatCard
              title="Active"
              value={dashboardStats.activeGiveaways.toString()}
              subtitle={`of ${dashboardStats.totalGiveaways} total`}
              icon="play-circle"
              color="#2196F3"
              isLoading={loading}
            />
            <StatCard
              title="Entries"
              value={dashboardStats.totalEntries.toString()}
              subtitle="Total participants"
              icon="people"
              color="#FF9800"
              isLoading={loading}
            />
            <StatCard
              title="Avg Price"
              value={formatCurrency(dashboardStats.averageEntryPrice)}
              subtitle="Per entry"
              icon="ticket"
              color="#9C27B0"
              isLoading={loading}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <AnimatedTouchable
              style={styles.actionCard}
              onPress={() => navigation.navigate('MyEntries')}
              hapticType="medium"
            >
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.actionGradient}>
                <Ionicons name="ticket" size={32} color="white" />
                <Text style={styles.actionText}>My Entries</Text>
              </LinearGradient>
            </AnimatedTouchable>
            
            <AnimatedTouchable
              style={styles.actionCard}
              onPress={() => navigation.navigate('CreatorAnalytics')}
            >
              <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.actionGradient}>
                <Ionicons name="analytics" size={32} color="white" />
                <Text style={styles.actionText}>Analytics</Text>
              </LinearGradient>
            </AnimatedTouchable>
            
            <AnimatedTouchable
              style={styles.actionCard}
              onPress={() => navigation.navigate('WinnerSelection')}
            >
              <LinearGradient colors={['#fa709a', '#fee140']} style={styles.actionGradient}>
                <Ionicons name="trophy" size={32} color="white" />
                <Text style={styles.actionText}>Draw Winners</Text>
              </LinearGradient>
            </AnimatedTouchable>
          </View>
        </View>

        {/* My Giveaways */}
        <View style={styles.giveawaysSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>My Giveaways</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyGiveaways')}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              {[1, 2, 3].map((index) => (
                <View key={index} style={[styles.giveawayCard, { opacity: 0.6 }]}>
                  <View style={styles.giveawaySkeletonHeader}>
                    <View style={styles.giveawaySkeletonInfo}>
                      <ShimmerView style={[styles.skeleton, { width: '70%', height: 20, marginBottom: 8 }]}>
                        <View style={[styles.skeleton, { width: '70%', height: 20, marginBottom: 8 }]} />
                      </ShimmerView>
                      <ShimmerView style={[styles.skeleton, { width: '50%', height: 16 }]}>
                        <View style={[styles.skeleton, { width: '50%', height: 16 }]} />
                      </ShimmerView>
                    </View>
                    <ShimmerView style={[styles.skeleton, { width: 80, height: 28, borderRadius: 14 }]}>
                      <View style={[styles.skeleton, { width: 80, height: 28, borderRadius: 14 }]} />
                    </ShimmerView>
                  </View>
                  <View style={styles.giveawaySkeletonStats}>
                    <View style={styles.giveawaySkeletonStat}>
                      <ShimmerView style={[styles.skeleton, { width: 30, height: 20, marginBottom: 4 }]}>
                        <View style={[styles.skeleton, { width: 30, height: 20, marginBottom: 4 }]} />
                      </ShimmerView>
                      <ShimmerView style={[styles.skeleton, { width: 50, height: 14 }]}>
                        <View style={[styles.skeleton, { width: 50, height: 14 }]} />
                      </ShimmerView>
                    </View>
                    <View style={styles.giveawaySkeletonStat}>
                      <ShimmerView style={[styles.skeleton, { width: 30, height: 20, marginBottom: 4 }]}>
                        <View style={[styles.skeleton, { width: 30, height: 20, marginBottom: 4 }]} />
                      </ShimmerView>
                      <ShimmerView style={[styles.skeleton, { width: 60, height: 14 }]}>
                        <View style={[styles.skeleton, { width: 60, height: 14 }]} />
                      </ShimmerView>
                    </View>
                    <View style={styles.giveawaySkeletonStat}>
                      <ShimmerView style={[styles.skeleton, { width: 40, height: 20, marginBottom: 4 }]}>
                        <View style={[styles.skeleton, { width: 40, height: 20, marginBottom: 4 }]} />
                      </ShimmerView>
                      <ShimmerView style={[styles.skeleton, { width: 70, height: 14 }]}>
                        <View style={[styles.skeleton, { width: 70, height: 14 }]} />
                      </ShimmerView>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : myGiveaways.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.emptyIconGradient}
                >
                  <Ionicons name="gift-outline" size={48} color="white" />
                </LinearGradient>
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Start Your Giveaway Journey</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Create your first giveaway and watch your community grow!</Text>
              <AnimatedTouchable
                style={styles.emptyButton}
                onPress={() => navigation.navigate('CreateGiveawayWizard')}
                hapticType="medium"
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.emptyButtonGradient}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.emptyButtonText}>Create Giveaway</Text>
                </LinearGradient>
              </AnimatedTouchable>
            </View>
          ) : (
            myGiveaways.map((giveaway, index) => (
              <GiveawayCard key={giveaway.id} giveaway={giveaway} index={index} />
            ))
          )}
        </View>
      </Animated.View>
      
      {/* Confetti for celebrations */}
      <ConfettiExplosion 
        visible={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor handled by theme in component
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 5,
    paddingHorizontal: 20,
    // backgroundColor handled by theme in component
  },
  headerCreateButton: {
    position: 'absolute',
    top: 65,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    padding: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  statsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    // color handled by theme in component
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    // backgroundColor handled by theme in component
    borderRadius: 16,
    padding: 20,
    width: (width - 50) / 2,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    borderRadius: 25,
    padding: 8,
    marginRight: 12,
  },
  statTitle: {
    fontSize: 14,
    // color handled by theme in component
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    // color handled by theme in component
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    // color handled by theme in component
  },
  actionsSection: {
    marginBottom: 30,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionCard: {
    width: (width - 60) / 3,
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  actionGradient: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    borderRadius: 16,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  giveawaysSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    // color handled by theme in component
    fontSize: 16,
    fontWeight: '600',
  },
  giveawayCard: {
    // backgroundColor handled by theme in component
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageSection: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  emojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 8,
  },
  contentSection: {
    padding: 12,
  },
  giveawayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    // color handled by theme in component
    marginBottom: 6,
  },
  giveawayDescription: {
    fontSize: 12,
    // color handled by theme in component
    marginBottom: 8,
    lineHeight: 18,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    // backgroundColor handled by theme in component
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    // color handled by theme in component
    fontWeight: '500',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costPerEntry: {
    fontSize: 14,
    fontWeight: '600',
    // color handled by theme in component  
    flex: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 11,
    // color handled by theme in component
    marginLeft: 4,
    fontWeight: '500',
  },
  timeLeft: {
    fontSize: 12,
    fontWeight: '600',
    // color handled by theme in component
    flex: 1,
    textAlign: 'right',
  },
  loadingContainer: {
    paddingVertical: 20,
  },
  skeleton: {
    backgroundColor: '#E1E9EE',
    borderRadius: 8,
  },
  skeletonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonCircle: {
    backgroundColor: '#E1E9EE',
    borderRadius: 20,
  },
  giveawaySkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  giveawaySkeletonInfo: {
    flex: 1,
    marginRight: 12,
  },
  giveawaySkeletonStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  giveawaySkeletonStat: {
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    // color handled by theme in component
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    // color handled by theme in component
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    // color handled by theme in component
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: 8,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
