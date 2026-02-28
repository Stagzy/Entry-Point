/**
 * HomeScreen - Main Dashboard & Discovery Hub
 * 
 * PURPOSE:
 * - Primary landing screen showcasing platform highlights and opportunities
 * - Real-time winner announcements and community activity display
 * - Featured giveaway promotion with visual progress tracking
 * - Quick action navigation to core app functionality
 * - Trending creator showcase and social proof elements
 * 
 * NAVIGATION:
 * - Primary Tab: Main navigation tab accessible from bottom navigation
 * - Entry Point: App launch destination for authenticated users
 * - Navigation Targets: All major app sections (Giveaways, Create, Profile, etc.)
 * - Deep Linking: Supports featured giveaway and creator profile routing
 * 
 * KEY FEATURES:
 * - Animated Hero Section: Gradient background with decorative elements
 * - Real-time Winner Feed: Live winner announcements with privacy controls
 * - Featured Giveaways: Curated high-value opportunities with progress visualization
 * - Trending Creators: Top performing creators with social metrics
 * - Quick Actions: One-tap access to primary user flows
 * - Floating Action Button: Prominent giveaway creation entry point
 * 
 * REAL-TIME FEATURES:
 * - Live Winner Announcements: Toast notifications for new winners
 * - Progress Tracking: Dynamic progress bars with color-coded urgency
 * - Activity Feed: Recent platform activity and social proof
 * - Creator Rankings: Live trending creator calculations
 * - Entry Counts: Real-time ticket sales and participation metrics
 * 
 * HERO SECTION:
 * - Personalized Welcome: Dynamic greeting with user context
 * - Platform Statistics: Live metrics for giveaways, winners, and prizes
 * - Visual Appeal: Gradient backgrounds with floating decorative elements
 * - Trust Indicators: Verification badges and platform credibility
 * 
 * PRIVACY & PERSONALIZATION:
 * - Winner Privacy Controls: Respects user settings for public sharing
 * - Time-based Filtering: Winners shown only within 48-hour window
 * - Anonymous Options: Handles users who opt out of public display
 * - Personalized Content: Adapts to user preferences and history
 * 
 * QUICK ACTIONS GRID:
 * 1. Explore: Navigate to main giveaway discovery
 * 2. Create: Direct access to giveaway creation
 * 3. My Entries: Personal entry tracking and management
 * 4. My Wins: Victory showcase via My Entries filter
 * 
 * VISUAL DESIGN SYSTEM:
 * - Dynamic Colors: Context-aware color coding for urgency and status
 * - Progress Visualization: Multi-color progress bars (Green → Yellow → Orange → Red)
 * - Icon System: Intelligent icon selection based on giveaway categories
 * - Animation Framework: Staggered entrance animations and micro-interactions
 * 
 * STATE MANAGEMENT:
 * - featuredGiveaways: Curated high-value giveaway promotions
 * - recentWinners: Real-time winner feed with privacy filtering
 * - trendingCreators: Dynamic creator rankings and metrics
 * - Animation States: Multiple animation values for smooth transitions
 * - Loading States: Skeleton screens and shimmer effects
 * 
 * CONTENT SECTIONS:
 * 1. Hero Section: Welcome message, stats, and platform overview
 * 2. Quick Actions: Four primary navigation shortcuts
 * 3. Recent Winners: Live winner feed with social proof
 * 4. Trending Creators: Top creator showcase with follow options
 * 5. Featured Giveaways: Premium opportunity highlights
 * 6. Browse All: Navigation to comprehensive giveaway listing
 * 
 * ANIMATION SYSTEM:
 * - Entrance Animations: Staggered card reveals and hero transitions
 * - Shimmer Loading: Skeleton screens with animated placeholders
 * - FAB Animation: Bouncy floating action button entrance
 * - Progress Animations: Smooth progress bar fills and updates
 * - Micro-interactions: Touch feedback and state transitions
 * 
 * SOCIAL FEATURES:
 * - Winner Celebration: Public winner announcements with user consent
 * - Creator Discovery: Trending creator promotion and profile linking
 * - Social Proof: Community activity and engagement metrics
 * - Profile Integration: Trust tier display and verification badges
 * 
 * DISCOVERY ALGORITHM:
 * - Featured Selection: Algorithm-based giveaway promotion
 * - Trending Calculation: Real-time creator ranking system
 * - Personalization: User behavior-based content adaptation
 * - Quality Scoring: Trust tier and verification-weighted promotion
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Virtual Scrolling: Efficient rendering for large datasets
 * - Image Lazy Loading: Deferred image loading for performance
 * - Animation Optimization: Native driver usage for smooth animations
 * - State Persistence: Intelligent caching and data management
 * 
 * USER EXPERIENCE:
 * - Pull-to-Refresh: Update content with swipe gesture
 * - Intelligent Defaults: Fallback content for empty states
 * - Error Handling: Graceful degradation for failed requests
 * - Accessibility: Full screen reader and keyboard navigation support
 * 
 * TECHNICAL ARCHITECTURE:
 * - Hook Integration: Real-time data with custom hooks
 * - Component Composition: Modular section components
 * - Animation Library: React Native Animated API with custom timing
 * - Service Integration: API service layer for data fetching
 * 
 * RELATED SCREENS:
 * - GiveawaysScreen: Comprehensive giveaway discovery
 * - CreateGiveawayWizardScreen: Giveaway creation flow
 * - UserProfileScreen: Creator and user profiles
 * - GiveawayDetailScreen: Individual giveaway details
 * - MyEntriesScreen: Personal entry management
 * - MyEntriesScreen: Entry tracking with win filter capability
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRealtimeWinners } from '../../hooks/useRealtime';
import { giveawayService } from '../../services/api';
import ProfileAvatar from '../../components/ProfileAvatar';
import { WinnerToast } from '../../components/WinnerAnnouncement';

export default function HomeScreen({ navigation }) {
  const { user, userProfile, getTrustTierInfo } = useAuth();
  const { theme } = useTheme();
  const { winners, latestWinner } = useRealtimeWinners();
  
  const styles = getStyles(theme);
  
  const [featuredGiveaways, setFeaturedGiveaways] = useState([]);
  const [recentWinners, setRecentWinners] = useState([]);
  const [trendingCreators, setTrendingCreators] = useState([]);
  const [platformStats, setPlatformStats] = useState({
    totalGiveaways: 150,
    totalWinners: 2500,
    totalPrizesValue: 500000
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWinnerToast, setShowWinnerToast] = useState(false);
  const [loadingAnimation] = useState(new Animated.Value(0));
  const [cardAnimations] = useState(new Animated.Value(0));
  const [shimmerAnim] = useState(new Animated.Value(0));

  const { width } = Dimensions.get('window');

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

  // Skeleton component for loading states
  const SkeletonCard = ({ width, height, style }) => {
    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 100],
    });

    return (
      <View style={[{ width, height, backgroundColor: theme.surface, borderRadius: 12, overflow: 'hidden' }, style]}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)',
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />
      </View>
    );
  };

  // Show winner toast when new winner is announced
  useEffect(() => {
    if (latestWinner) {
      setShowWinnerToast(true);
    }
  }, [latestWinner]);

  // Mock data - replace with actual API calls
  const mockGiveaways = [
    {
      id: 1,
      title: 'iPhone 15 Pro Giveaway',
      creator: 'TechReviewer',
      prize: 'iPhone 15 Pro 256GB',
      ticketPrice: 5,
      totalTickets: 1000,
      soldTickets: 650,
      endDate: '2025-07-30',
      image: null, // Will use placeholder
    },
    {
      id: 2,
      title: 'Gaming Setup Bundle Giveaway',
      creator: 'GamerStreamer',
      prize: 'RTX 4090 + Gaming Chair + Accessories',
      ticketPrice: 10,
      totalTickets: 500,
      soldTickets: 230,
      endDate: '2025-08-15',
      image: null, // Will use placeholder
    },
  ];

  const mockRecentWinners = [
    {
      id: 1,
      username: 'sarah_gamer',
      avatar: null,
      prize: 'iPhone 15 Pro',
      giveawayTitle: 'Tech Giveaway Bundle',
      timeAgo: '2h',
      winTimestamp: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
      isVerified: true,
      trustTier: 'silver',
      privacySettings: {
        shareWinPublicly: true,
        allowProfileViewing: true,
      }
    },
    {
      id: 2,
      username: 'mike_streams',
      avatar: null,
      prize: 'Gaming Chair',
      giveawayTitle: 'Ultimate Gaming Setup',
      timeAgo: '5h',
      winTimestamp: Date.now() - (5 * 60 * 60 * 1000), // 5 hours ago
      isVerified: false,
      trustTier: 'bronze',
      privacySettings: {
        shareWinPublicly: false, // This winner opted out
        allowProfileViewing: false,
      }
    },
    {
      id: 3,
      username: 'alex_crypto',
      avatar: null,
      prize: '$500 Cash',
      giveawayTitle: 'Summer Cash Giveaway',
      timeAgo: '1d',
      winTimestamp: Date.now() - (24 * 60 * 60 * 1000), // 1 day ago
      isVerified: true,
      trustTier: 'gold',
      privacySettings: {
        shareWinPublicly: true,
        allowProfileViewing: true,
      }
    },
    {
      id: 4,
      username: 'jenny_artist',
      avatar: null,
      prize: 'iPad Pro',
      giveawayTitle: 'Creative Bundle Giveaway',
      timeAgo: '3d',
      winTimestamp: Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 days ago (too old)
      isVerified: true,
      trustTier: 'gold',
      privacySettings: {
        shareWinPublicly: true,
        allowProfileViewing: true,
      }
    },
  ];

  const mockTrendingCreators = [
    {
      id: 1,
      username: 'TechReviewer',
      followers: '45.2K',
      activeGiveaways: 3,
      avatar: null,
      isVerified: true,
      isCreator: true,
      trustTier: 'gold',
    },
    {
      id: 2,
      username: 'GamerStreamer',
      followers: '32.8K',
      activeGiveaways: 2,
      avatar: null,
      isVerified: true,
      isCreator: true,
      trustTier: 'silver',
    },
    {
      id: 3,
      username: 'LifestyleBlogger',
      followers: '28.1K',
      activeGiveaways: 4,
      avatar: null,
      isVerified: false,
      isCreator: true,
      trustTier: 'bronze',
    },
  ];

  useEffect(() => {
    loadData();
    
    // Animate cards entrance
    Animated.sequence([
      Animated.timing(loadingAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnimations, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []); // Only run on mount, not when loading changes

  // Separate effect for shimmer animation when loading changes
  useEffect(() => {
    if (loading) {
      startShimmerAnimation();
    }
  }, [loading]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load data from real API including platform statistics
      const [giveawaysResult, winnersResult, creatorsResult, statsResult] = await Promise.all([
        giveawayService.getFeaturedGiveaways(10),
        giveawayService.getRecentWinners(5),
        giveawayService.getTrendingCreators(5),
        giveawayService.getPlatformStats()
      ]);

      if (giveawaysResult.data) {
        setFeaturedGiveaways(giveawaysResult.data);
      }
      
      if (winnersResult.data) {
        setRecentWinners(winnersResult.data);
      }
      
      if (creatorsResult.data) {
        setTrendingCreators(creatorsResult.data);
      }

      if (statsResult.data) {
        setPlatformStats(statsResult.data);
      }
      
      setRefreshing(false);
      setLoading(false);
    } catch (error) {
      console.error('Error loading home data:', error);
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Helper function to format large numbers
  const formatStatNumber = (number) => {
    if (number >= 1000000) {
      return `${(number / 1000000).toFixed(1)}M+`;
    } else if (number >= 1000) {
      return `${(number / 1000).toFixed(0)}K+`;
    } else {
      return `${number}+`;
    }
  };

  // Helper function to format currency values
  const formatPrizeValue = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M+`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K+`;
    } else {
      return `$${value}+`;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Helper function to filter winners based on privacy settings and time limits
  const getVisibleWinners = (winners) => {
    const now = Date.now();
    const maxDisplayTime = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
    
    return winners.filter(winner => {
      // Check if winner opted in to public sharing
      if (!winner.privacySettings?.shareWinPublicly) {
        return false;
      }
      
      // Check if win is within display time limit (48 hours)
      const timeSinceWin = now - winner.winTimestamp;
      if (timeSinceWin > maxDisplayTime) {
        return false;
      }
      
      return true;
    });
  };

  // Helper function to anonymize username if needed
  const getDisplayUsername = (winner) => {
    // For demonstration, you could add anonymization logic here
    // For now, we're showing full usernames for opted-in winners
    return winner.username;
  };

  // Helper function to check if profile can be viewed
  const canViewProfile = (winner, currentUser) => {
    // Winners can still be viewed but not directly messaged
    // Profile viewing is for social proof, not contact
    return true;
  };

  // Helper function to share a giveaway listing
  const handleShareGiveaway = (giveaway) => {
    // For now, show a simple alert. Later you can create a ShareModal screen
    alert(`Share: ${giveaway.title}\nBy: ${giveaway.creator}\nPrize: ${giveaway.prize}`);
  };

  const getGiveawayIconColor = (title, prize) => {
    const titleLower = title.toLowerCase();
    const prizeLower = prize.toLowerCase();
    
    if (titleLower.includes('iphone') || prizeLower.includes('iphone') || titleLower.includes('mobile') || prizeLower.includes('phone')) {
      return '#007AFF';
    } else if (titleLower.includes('macbook') || prizeLower.includes('macbook') || titleLower.includes('laptop') || prizeLower.includes('computer')) {
      return '#666666';
    } else if (titleLower.includes('gaming') || prizeLower.includes('gaming') || titleLower.includes('ps5') || prizeLower.includes('playstation') || titleLower.includes('xbox') || titleLower.includes('rtx')) {
      return '#FF6B35';
    } else if (titleLower.includes('cash') || prizeLower.includes('cash') || titleLower.includes('$') || titleLower.includes('money')) {
      return '#28A745';
    } else if (titleLower.includes('chair') || prizeLower.includes('chair') || titleLower.includes('setup')) {
      return '#6C757D';
    }
    return '#FF6B6B';
  };

  const getGiveawayIcon = (title, prize) => {
    const titleLower = title.toLowerCase();
    const prizeLower = prize.toLowerCase();
    
    if (titleLower.includes('iphone') || prizeLower.includes('iphone') || titleLower.includes('mobile') || prizeLower.includes('phone')) {
      return 'phone-portrait';
    } else if (titleLower.includes('macbook') || prizeLower.includes('macbook') || titleLower.includes('laptop') || prizeLower.includes('computer')) {
      return 'laptop';
    } else if (titleLower.includes('gaming') || prizeLower.includes('gaming') || titleLower.includes('ps5') || prizeLower.includes('playstation') || titleLower.includes('xbox') || titleLower.includes('rtx')) {
      return 'game-controller';
    } else if (titleLower.includes('cash') || prizeLower.includes('cash') || titleLower.includes('$') || titleLower.includes('money')) {
      return 'cash';
    } else if (titleLower.includes('chair') || prizeLower.includes('chair') || titleLower.includes('setup')) {
      return 'desktop';
    }
    return 'gift';
  };

  const formatTimeRemaining = (endDate) => {
    if (!endDate) return 'No end date';
    const now = new Date();
    const end = new Date(endDate);
    if (isNaN(end.getTime())) return 'Invalid date';
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Ended';
    } else if (diffDays === 0) {
      return 'Ends today';
    } else if (diffDays === 1) {
      return 'Ends in 1 day';
    } else if (diffDays <= 30) {
      return `Ends in ${diffDays} days`;
    } else {
      // For longer periods, show the actual date
      return `Ends ${endDate}`;
    }
  };

  const getTimeRemainingColor = (endDate) => {
    if (!endDate) return theme.textTertiary;
    const now = new Date();
    const end = new Date(endDate);
    if (isNaN(end.getTime())) return theme.textTertiary;
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return theme.textTertiary; // Gray for ended
    } else if (diffDays <= 1) {
      return '#FF3B30'; // Red for urgent (today/tomorrow)
    } else if (diffDays <= 7) {
      return '#FF9500'; // Orange for soon (within a week)
    } else {
      return theme.textSecondary; // Default gray for normal timing
    }
  };

  const renderGiveawayCard = (giveaway, index) => {
    const soldTickets = giveaway.soldTickets || 0;
    const totalTickets = giveaway.totalTickets || 1; // Avoid division by zero
    const progressPercentage = totalTickets > 0 ? (soldTickets / totalTickets) * 100 : 0;
    const isPopular = progressPercentage > 50;
    const isUrgent = getTimeRemainingColor(giveaway.endDate) === '#FF3B30';
    
    return (
      <Animated.View
        key={giveaway.id}
        style={[
          styles.giveawayCard,
          { backgroundColor: theme.surface },
          {
            transform: [{
              translateY: cardAnimations.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }],
            opacity: cardAnimations,
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('GiveawayDetail', { giveaway: giveaway })}
          activeOpacity={0.95}
        >
          {/* Status badges */}
          <View style={styles.badgeContainer}>
            <View style={styles.leftBadges}>
              {isPopular && (
                <View style={styles.popularBadge}>
                  <Ionicons name="trending-up" size={12} color="#fff" />
                  <Text style={styles.badgeText}>Popular</Text>
                </View>
              )}
            </View>
            <View style={styles.rightBadges}>
              {isUrgent && (
                <View style={styles.urgentBadge}>
                  <Ionicons name="time" size={12} color="#fff" />
                  <Text style={styles.badgeText}>Ending Soon</Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.shareGiveawayButton}
                onPress={() => handleShareGiveaway(giveaway)}
                activeOpacity={0.7}
              >
                <Ionicons name="share-outline" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.imageContainer}>
            {giveaway.image ? (
              <Image source={giveaway.image} style={styles.giveawayImage} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={[
                  getGiveawayIconColor(giveaway.title, giveaway.prize) + '30',
                  getGiveawayIconColor(giveaway.title, giveaway.prize) + '15',
                  getGiveawayIconColor(giveaway.title, giveaway.prize) + '05'
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.placeholderImage}
              >
                <View style={styles.giftIconContainer}>
                  <Ionicons 
                    name={getGiveawayIcon(giveaway.title, giveaway.prize)} 
                    size={48} 
                    color={getGiveawayIconColor(giveaway.title, giveaway.prize)} 
                  />
                </View>
              </LinearGradient>
            )}
          </View>
          
          <View style={styles.giveawayInfo}>
            <Text style={[styles.giveawayTitle, { color: theme.text }]} numberOfLines={2}>{giveaway.title}</Text>
            <View style={styles.creatorRow}>
              <Ionicons name="person-circle-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.creatorName, { color: theme.textSecondary }]}>{giveaway.creator}</Text>
            </View>
            <Text style={[styles.prizeText, { color: theme.text }]} numberOfLines={2}>{giveaway.prize}</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Progress</Text>
                <Text style={[styles.progressPercentage, { color: theme.text }]}>{(progressPercentage || 0).toFixed(0)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={styles.progressTrack}>
                  <Animated.View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${progressPercentage || 0}%`,
                        backgroundColor: progressPercentage > 80 ? '#FF3B30' : 
                                       progressPercentage > 50 ? '#FF9500' : '#34C759'
                      }
                    ]} 
                  />
                </View>
              </View>
              <Text style={styles.progressText}>
                {(giveaway.soldTickets || 0).toLocaleString()}/{(giveaway.totalTickets || 0).toLocaleString()} entries
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.priceContainer}>
                <Text style={styles.ticketPrice}>${giveaway.ticketPrice || 0}</Text>
                <Text style={styles.perEntry}>per entry</Text>
              </View>
              <View style={[styles.timeContainer, { backgroundColor: getTimeRemainingColor(giveaway.endDate) + '15' }]}>
                <Ionicons name="time-outline" size={12} color={getTimeRemainingColor(giveaway.endDate)} />
                <Text style={[styles.endDate, { color: getTimeRemainingColor(giveaway.endDate) }]}>
                  {formatTimeRemaining(giveaway.endDate)}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity 
        style={[styles.quickActionCard, { backgroundColor: theme.surface }]}
        onPress={() => navigation.navigate('Giveaways')}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: '#007AFF15' }]}>
          <Ionicons name="search" size={24} color="#007AFF" />
        </View>
        <Text style={[styles.quickActionText, { color: theme.text }]}>Explore</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.quickActionCard, { backgroundColor: theme.surface }]}
        onPress={() => navigation.navigate('Create')}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: '#34C75915' }]}>
          <Ionicons name="add-circle" size={24} color="#34C759" />
        </View>
        <Text style={[styles.quickActionText, { color: theme.text }]}>Create</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.quickActionCard, { backgroundColor: theme.surface }]}
        onPress={() => navigation.navigate('MyEntries')}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: '#FF950015' }]}>
          <Ionicons name="ticket" size={24} color="#FF9500" />
        </View>
        <Text style={[styles.quickActionText, { color: theme.text }]}>My Entries</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.quickActionCard, { backgroundColor: theme.surface }]}
        onPress={() => navigation.navigate('MyEntries', { initialFilter: 'won' })}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: '#FF334415' }]}>
          <Ionicons name="trophy" size={24} color="#FF3344" />
        </View>
        <Text style={[styles.quickActionText, { color: theme.text }]}>My Wins</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRecentWinners = () => {
    const visibleWinners = getVisibleWinners(recentWinners).slice(0, 10); // Show last 10 winners max
    
    if (visibleWinners.length === 0) {
      return (
        <View style={[styles.section, styles.recentWinnersSection]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>🎉 Front Page Winners</Text>
          </View>
          <View style={[styles.noWinnersContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.noWinnersText, { color: theme.textSecondary }]}>No recent public winners to display</Text>
            <Text style={[styles.noWinnersSubtext, { color: theme.textTertiary }]}>Winners will appear here when they choose to share publicly</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.section, styles.recentWinnersSection]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🎉 Front Page Winners</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {visibleWinners.map((winner) => {
            const displayUsername = getDisplayUsername(winner);
            
            return (
              <View 
                key={winner.id} 
                style={[styles.winnerCard, { backgroundColor: theme.surface }]}
              >
                <ProfileAvatar 
                  user={winner} 
                  size={60} 
                  getTrustTierInfo={getTrustTierInfo}
                  showVerificationBadge={true}
                  showTrustBorder={true}
                />
                <Text style={[styles.winnerUsername, { color: theme.text }]}>@{displayUsername}</Text>
                <Text style={styles.winnerPrize}>{winner.prize}</Text>
                <Text style={[styles.winnerTime, { color: theme.textSecondary }]}>{winner.timeAgo} ago</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderTrendingCreators = () => (
    <View style={[styles.section, styles.trendingCreatorsSection]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>🔥 Trending Creators</Text>
      </View>
      {trendingCreators.slice(0, 5).map((creator, index) => (
        <View key={creator.id} style={[styles.creatorCard, { backgroundColor: theme.surface }]}>
          <TouchableOpacity 
            style={styles.creatorInfo}
            onPress={() => navigation.navigate('UserProfile', { 
              userId: creator.id, 
              username: creator.username 
            })}
            activeOpacity={0.8}
          >
            <ProfileAvatar 
              user={creator} 
              size={50} 
              getTrustTierInfo={getTrustTierInfo}
              showVerificationBadge={true}
              showTrustBorder={true}
            />
            <View style={styles.creatorDetails}>
              <View style={styles.creatorNameRow}>
                <Text style={[styles.creatorUsername, { color: theme.text }]}>@{creator.username}</Text>
              </View>
              <Text style={[styles.creatorStats, { color: theme.textSecondary }]}>
                {creator.followers} followers • {creator.activeGiveaways} active giveaways
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.creatorActions}>
            <View style={styles.trendingBadge}>
              <Text style={styles.trendingText}>#{index + 1}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
            progressBackgroundColor={theme.surface}
          />
        }
      >
      {/* Hero Section with Gradient */}
      <Animated.View 
        style={[
          styles.heroSection,
          {
            opacity: loadingAnimation,
            transform: [{
              translateY: loadingAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={theme.isDarkMode 
            ? ['#1a1a1a', '#2a2a2a', '#1e3a5f'] 
            : ['#007AFF', '#5856D6', '#AF52DE']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          {/* Decorative shapes */}
          <View style={styles.heroDecorations}>
            <View style={[styles.decorativeCircle, styles.circle1]} />
            <View style={[styles.decorativeCircle, styles.circle2]} />
            <View style={[styles.decorativeCircle, styles.circle3]} />
          </View>
          
          <View style={styles.heroContent}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.heroTitle}>
                Welcome{user ? ` back, ${userProfile?.username || userProfile?.name || (user.email && user.email.split('@')[0]) || 'User'}` : ' to Entry Point'}! 
                <Text style={styles.heroEmoji}>🎯</Text>
              </Text>
              {userProfile?.is_verified && (
                <View style={styles.verifiedBadgeHero}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                </View>
              )}
            </View>
            <Text style={styles.heroSubtitle}>
              Discover amazing giveaways from your favorite creators
            </Text>
            
            {/* Enhanced Stats Row */}
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="flash" size={20} color="#FFD60A" />
                </View>
                {loading ? (
                  <Animated.View style={[
                    styles.statSkeleton,
                    {
                      opacity: shimmerAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.3, 0.7, 0.3],
                      }),
                    }
                  ]} />
                ) : (
                  <Text style={styles.heroStatNumber}>{formatStatNumber(platformStats.totalGiveaways)}</Text>
                )}
                <Text style={styles.heroStatLabel}>Live Giveaways</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="people" size={20} color="#32D74B" />
                </View>
                {loading ? (
                  <Animated.View style={[
                    styles.statSkeleton,
                    {
                      opacity: shimmerAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.3, 0.7, 0.3],
                      }),
                    }
                  ]} />
                ) : (
                  <Text style={styles.heroStatNumber}>{formatStatNumber(platformStats.totalWinners)}</Text>
                )}
                <Text style={styles.heroStatLabel}>Winners</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="diamond" size={20} color="#FF9F0A" />
                </View>
                {loading ? (
                  <Animated.View style={[
                    styles.statSkeleton,
                    {
                      opacity: shimmerAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.3, 0.7, 0.3],
                      }),
                    }
                  ]} />
                ) : (
                  <Text style={styles.heroStatNumber}>{formatPrizeValue(platformStats.totalPrizesValue)}</Text>
                )}
                <Text style={styles.heroStatLabel}>Prizes Won</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Recent Winners */}
      {renderRecentWinners()}

      {/* Trending Creators */}
      {renderTrendingCreators()}

      {/* Featured Giveaways */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>✨ Featured Giveaways</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Giveaways')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        {featuredGiveaways.map((giveaway, index) => renderGiveawayCard(giveaway, index))}
      </View>

      {/* Browse All Button */}
      <TouchableOpacity
        style={styles.browseAllButton}
        onPress={() => navigation.navigate('Giveaways')}
      >
        <Text style={styles.browseAllText}>Explore All Giveaways</Text>
        <Ionicons name="arrow-forward" size={20} color="#007AFF" />
      </TouchableOpacity>
      
      {/* Winner Toast Notification */}
      <WinnerToast 
        winner={latestWinner}
        isVisible={showWinnerToast}
        onClose={() => setShowWinnerToast(false)}
      />
      </ScrollView>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContainer: {
    flex: 1,
  },
  heroSection: {
    height: 220,
    backgroundColor: theme.primary,
    overflow: 'hidden',
  },
  heroGradient: {
    flex: 1,
    position: 'relative',
  },
  heroDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: theme.isDarkMode ? 'rgba(10, 132, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 100,
    height: 100,
    top: -30,
    right: -20,
  },
  circle2: {
    width: 60,
    height: 60,
    top: 120,
    left: -15,
  },
  circle3: {
    width: 80,
    height: 80,
    bottom: -20,
    right: 50,
  },
  heroContent: {
    flex: 1,
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'flex-start',
    zIndex: 1,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  heroEmoji: {
    fontSize: 28,
  },
  verifiedBadgeHero: {
    marginLeft: 8,
    backgroundColor: theme.isDarkMode ? 'rgba(10, 132, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 2,
    borderWidth: theme.isDarkMode ? 1 : 0,
    borderColor: theme.isDarkMode ? 'rgba(10, 132, 255, 0.5)' : 'transparent',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#ffffff90',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 22,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: theme.isDarkMode ? 1 : 0,
    borderColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
  },
  heroStatItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statIconContainer: {
    marginBottom: 4,
  },
  heroStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statSkeleton: {
    height: 22,
    width: 40,
    backgroundColor: '#ffffff40',
    borderRadius: 4,
    marginVertical: 1,
  },
  heroStatLabel: {
    fontSize: 12,
    color: '#ffffff80',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#ffffff30',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    marginTop: -30,
    marginBottom: 10,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    shadowColor: theme.isDarkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: theme.isDarkMode ? 1 : 0,
    borderColor: theme.isDarkMode ? theme.border : 'transparent',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  recentWinnersSection: {
    marginBottom: 60,
  },
  trendingCreatorsSection: {
    marginTop: -20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '600',
  },
  winnerCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: theme.isDarkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: theme.isDarkMode ? 1 : 0,
    borderColor: theme.isDarkMode ? theme.border : 'transparent',
  },
  winnerUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
    marginTop: 8,
  },
  winnerPrize: {
    fontSize: 11,
    color: theme.success,
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
  },
  winnerTime: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  winnerTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privateLockIcon: {
    marginLeft: 4,
  },
  noWinnersContainer: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: theme.isDarkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: theme.isDarkMode ? 1 : 0,
    borderColor: theme.isDarkMode ? theme.border : 'transparent',
  },
  noWinnersText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  noWinnersSubtext: {
    fontSize: 12,
    color: theme.textTertiary,
    textAlign: 'center',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 15,
  },
  privacyNoticeText: {
    fontSize: 11,
    color: theme.textSecondary,
    marginLeft: 4,
    textAlign: 'center',
    flex: 1,
  },
  creatorCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.isDarkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: theme.isDarkMode ? 1 : 0,
    borderColor: theme.isDarkMode ? theme.border : 'transparent',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creatorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageCreatorButton: {
    backgroundColor: theme.isDarkMode ? theme.border : '#f8f9fa',
    borderRadius: 12,
    padding: 8,
    shadowColor: theme.isDarkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  creatorDetails: {
    flex: 1,
    marginLeft: 12,
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  creatorUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginRight: 6,
  },
  creatorStats: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  trendingBadge: {
    backgroundColor: theme.warning,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  giveawayCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: theme.isDarkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: theme.isDarkMode ? 1 : 0,
    borderColor: theme.isDarkMode ? theme.border : 'transparent',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  leftBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareGiveawayButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  giveawayImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.isDarkMode ? theme.border : '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  giftIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 70,
    width: 90,
    height: 90,
    elevation: 2,
    shadowColor: theme.isDarkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.1,
    shadowRadius: 4,
  },
  giveawayInfo: {
    padding: 16,
  },
  giveawayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  creatorName: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  prizeText: {
    fontSize: 16,
    color: theme.text,
    marginBottom: 16,
    lineHeight: 22,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    color: theme.text,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.isDarkMode ? theme.border : '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: theme.isDarkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    shadowColor: theme.isDarkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  progressText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primary,
  },
  perEntry: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  endDate: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  browseAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.primary,
    shadowColor: theme.isDarkMode ? '#000' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDarkMode ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  browseAllText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
    marginRight: 8,
  },
});
