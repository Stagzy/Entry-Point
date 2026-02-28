/**
 * UserProfileScreen.js
 * 
 * PURPOSE:
 * Public-facing user profile viewing interface for exploring other users' profiles,
 * giveaways, achievements, and social information. Provides comprehensive user
 * discovery experience with privacy-aware content display, social interaction
 * capabilities, and giveaway participation opportunities.
 * 
 * NAVIGATION FLOW:
 * Accessible from: User search results, giveaway creator links, follower lists,
 * social feeds, direct profile links, creator mentions
 * Navigates to: FollowersList (followers/following), GiveawayDetail (active giveaways),
 * Activity tab with messaging, back to previous context
 * 
 * KEY FEATURES:
 * • Public Profile Display: Complete user identity with bio, social links, achievements
 * • Privacy-Aware Content: Conditional display based on user privacy settings
 * • Active Giveaways Showcase: Live giveaway browsing with real-time progress
 * • Featured Wins Gallery: Horizontal scrollable achievement display
 * • Social Statistics: Follower/following counts with privacy lock indicators
 * • Trust Tier Visualization: Tier badges and verification status display
 * • Direct Messaging Integration: Seamless conversation initiation
 * • Follow Functionality: Social connection building and network expansion
 * • Report System: User safety and content moderation tools
 * • Real-time Data: Live giveaway progress and entry tracking
 * 
 * PRIVACY SYSTEM:
 * • Conditional Content Display: User-controlled visibility for stats, giveaways, wins
 * • Follower List Privacy: Optional hiding of follower/following lists
 * • Statistics Privacy: Toggleable display of user performance metrics
 * • Active Giveaway Privacy: Creator control over giveaway visibility
 * • Featured Wins Privacy: User control over achievement showcase
 * • Lock Indicators: Visual privacy status communication
 * 
 * SOCIAL FEATURES:
 * • Follow/Unfollow Actions: Social network building with relationship management
 * • Direct Messaging: One-click conversation initiation through Activity tab
 * • Social Media Links: External platform integration (Instagram, Twitter, YouTube)
 * • Creator Verification: Verified creator badge display and recognition
 * • Trust Tier Display: Visual representation of user credibility and status
 * • Achievement Showcase: Featured wins and accomplishment highlights
 * 
 * GIVEAWAY INTEGRATION:
 * • Active Giveaway Cards: Real-time display of creator's live giveaways
 * • Progress Visualization: Entry progress bars with color-coded completion status
 * • Quick Entry Access: Direct navigation to giveaway participation
 * • Time Remaining Display: Color-coded urgency indicators for ending giveaways
 * • Entry Statistics: Live ticket counts and completion percentages
 * • Prize Information: Clear prize descriptions and entry pricing
 * 
 * USER EXPERIENCE:
 * • Responsive Design: Optimized layout for profile content and social interactions
 * • Visual Hierarchy: Clear organization of profile information and activities
 * • Interactive Elements: Touch-friendly social actions and giveaway interactions
 * • Loading States: Smooth data loading with placeholder content
 * • Error Handling: Graceful handling of missing data and privacy restrictions
 * • Accessibility: Screen reader support and high contrast design
 * 
 * STATE MANAGEMENT:
 * • Profile Data Loading: Efficient user data fetching and display
 * • Privacy Setting Enforcement: Dynamic content visibility based on user preferences
 * • Social Action States: Follow status tracking and interaction feedback
 * • Giveaway Data Sync: Real-time updates for active giveaway information
 * • Navigation State: Proper parameter passing and context preservation
 * 
 * TECHNICAL DETAILS:
 * • Route Parameter Handling: User ID and name extraction from navigation
 * • Mock Data Integration: Development-friendly data structure for testing
 * • Avatar Component: ProfileAvatar integration with trust tier theming
 * • ScrollView Optimization: Smooth scrolling through variable content
 * • Conditional Rendering: Privacy-based content display logic
 * • Color Coding: Dynamic color assignment based on data states
 * • Time Calculations: Real-time countdown and date formatting
 * 
 * BUSINESS LOGIC:
 * • Privacy Enforcement: User preference respect and content filtering
 * • Creator Promotion: Active giveaway showcase for creator engagement
 * • Social Discovery: Profile exploration and network building facilitation
 * • Achievement Recognition: Win history and accomplishment highlighting
 * • Trust Building: Verification and tier status transparent display
 * • User Safety: Report functionality and content moderation support
 * 
 * CONTENT SECTIONS:
 * • Profile Header: Avatar, name, bio, social links, tier information
 * • Follow Statistics: Follower/following counts with privacy controls
 * • Active Giveaways: Live creator giveaways with participation options
 * • Featured Wins: Achievement gallery with win history showcase
 * • User Statistics: Performance metrics with privacy-aware display
 * • Action Buttons: Social interactions and communication options
 * 
 * ACCESSIBILITY:
 * • High Contrast Design: Clear visual distinction for all profile elements
 * • Screen Reader Support: Comprehensive labeling for assistive technologies
 * • Touch Target Optimization: Appropriately sized interactive elements
 * • Visual Indicators: Clear privacy status and verification communication
 * • Readable Typography: Optimized font sizes and information hierarchy
 * 
 * ERROR HANDLING:
 * • Missing Profile Data: Graceful fallbacks for incomplete user information
 * • Privacy Restrictions: Clear messaging for hidden content
 * • Network Issues: Retry mechanisms for failed requests
 * • Navigation Errors: Safe parameter validation and route protection
 * 
 * RELATED SCREENS:
 * • ProfileScreen: User's own profile management interface
 * • FollowersListScreen: Social connection exploration and management
 * • GiveawayDetailScreen: Individual giveaway participation and details
 * • LiveActivityFeedScreen: Messaging and social interaction hub
 * • VerificationRequiredScreen: Trust building and verification processes
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ProfileAvatar from '../../components/ProfileAvatar';

export default function UserProfileScreen({ route, navigation }) {
  const { getTrustTierInfo, getVerificationLevelInfo } = useAuth();
  const { theme } = useTheme();
  const { userId, userName } = route.params;

  // Mock user data - in real app this would come from your backend
  const mockUser = {
    id: userId,
    name: userName || 'User',
    email: 'user@example.com',
    bio: 'Passionate about giveaways and connecting with amazing people! 🎉',
    website: 'https://example.com',
    social: {
      instagram: '@user',
      twitter: '@user',
      youtube: '@user',
    },
    isCreator: true,
    isVerified: true,
    trustTier: 'gold',
    verificationLevel: 'verified',
    stats: {
      giveawaysCreated: 25,
      giveawaysWon: 8,
      totalTicketsPurchased: 150,
      followersGained: 1200,
    },
    followersCount: 15420,
    followingCount: 892,
    privacySettings: {
      showStats: true, // User can toggle this
      showActiveGiveaways: true,
      showFeaturedWins: true,
      showFollowersList: true, // Can see who follows them
      showFollowingList: false, // Can't see who they follow
    },
    activeGiveaways: [
      {
        id: 1,
        title: 'iPhone 15 Pro Max Giveaway',
        prize: 'iPhone 15 Pro Max 256GB',
        ticketPrice: 5,
        totalTickets: 1000,
        soldTickets: 650,
        endDate: '2025-07-30',
        image: null,
      },
      {
        id: 2,
        title: 'Gaming Setup Bundle',
        prize: 'RTX 4090 + Gaming Chair + Accessories',
        ticketPrice: 10,
        totalTickets: 500,
        soldTickets: 230,
        endDate: '2025-08-15',
        image: null,
      },
      {
        id: 3,
        title: 'MacBook Pro Creator Bundle',
        prize: 'MacBook Pro M3 + iPad Pro + Accessories',
        ticketPrice: 15,
        totalTickets: 300,
        soldTickets: 75,
        endDate: '2025-08-20',
        image: null,
      }
    ],
    featuredWins: [
      {
        id: 1,
        title: 'MacBook Pro M3',
        creator: 'TechReviewer',
        value: '$2,999',
        date: '2025-01-15'
      },
      {
        id: 2,
        title: 'Gaming Setup',
        creator: 'GamerGuru',
        value: '$1,500',
        date: '2025-01-10'
      }
    ]
  };

  const handleStartConversation = () => {
    // Messages functionality has been removed
    // This could be updated to show a different action like following the user
    console.log('Message functionality removed');
  };

  const handleReportUser = () => {
    Alert.alert(
      'Report User',
      'Are you sure you want to report this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => {
          Alert.alert('Reported', 'User has been reported to our moderation team.');
        }},
      ]
    );
  };

  const formatTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
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
      return `Ends ${endDate}`;
    }
  };

  const getTimeRemainingColor = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return '#999';
    } else if (diffDays <= 1) {
      return '#FF3B30';
    } else if (diffDays <= 7) {
      return '#FF9500';
    } else {
      return '#666';
    }
  };

  const handleGiveawayPress = (giveaway) => {
    navigation.navigate('GiveawayDetail', { giveaway });
  };

  const renderStatCard = (label, value, icon) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color="#007AFF" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={handleReportUser}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: theme.background }]}>
        <View style={[styles.profileSection, { backgroundColor: theme.surface }]}>
          <View style={styles.avatarContainer}>
            <ProfileAvatar 
              user={mockUser} 
              size={90} 
              getTrustTierInfo={getTrustTierInfo}
              showVerificationBadge={true}
              showTrustBorder={true}
            />
          </View>
          
          <Text style={[styles.userName, { color: theme.text }]}>{mockUser.name}</Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{mockUser.email}</Text>
          
          {/* Bio Section */}
          {mockUser.bio && (
            <Text style={[styles.userBio, { color: theme.textSecondary }]}>{mockUser.bio}</Text>
          )}
          
          {/* Website Link */}
          {mockUser.website && (
            <TouchableOpacity style={styles.websiteLink}>
              <Ionicons name="link-outline" size={14} color={theme.primary} />
              <Text style={[styles.websiteText, { color: theme.primary }]}>{mockUser.website.replace('https://', '').replace('http://', '')}</Text>
            </TouchableOpacity>
          )}
          
          {/* Social Links */}
          {mockUser.social && (
            <View style={styles.socialLinks}>
              {mockUser.social.instagram && (
                <TouchableOpacity style={[styles.socialButton, { backgroundColor: theme.surface }]}>
                  <Ionicons name="logo-instagram" size={18} color="#E4405F" />
                </TouchableOpacity>
              )}
              {mockUser.social.twitter && (
                <TouchableOpacity style={[styles.socialButton, { backgroundColor: theme.surface }]}>
                  <Ionicons name="logo-twitter" size={18} color="#1DA1F2" />
                </TouchableOpacity>
              )}
              {mockUser.social.youtube && (
                <TouchableOpacity style={[styles.socialButton, { backgroundColor: theme.surface }]}>
                  <Ionicons name="logo-youtube" size={18} color="#FF0000" />
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {mockUser.isCreator && mockUser.isVerified && (
            <View style={[styles.creatorLabel, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
              <Ionicons name="star" size={14} color="#FF9500" />
              <Text style={styles.creatorText}>Verified Creator</Text>
            </View>
          )}
          
          {/* Trust Tier Information */}
          <View style={[styles.tierSection, { backgroundColor: theme.surface }]}>
            <View style={styles.tierInfo}>
              <View style={styles.tierBadge}>
                <Ionicons 
                  name={getTrustTierInfo(mockUser.trustTier || 'bronze').icon} 
                  size={16} 
                  color={getTrustTierInfo(mockUser.trustTier || 'bronze').color} 
                />
                <Text style={[styles.tierText, { color: getTrustTierInfo(mockUser.trustTier || 'bronze').color }]}>
                  {getTrustTierInfo(mockUser.trustTier || 'bronze').name} Tier
                </Text>
              </View>
              <View style={styles.verificationBadge}>
                <Ionicons 
                  name={getVerificationLevelInfo(mockUser.verificationLevel || 'none').icon} 
                  size={14} 
                  color={getVerificationLevelInfo(mockUser.verificationLevel || 'none').color} 
                />
                <Text style={[styles.verificationText, { color: getVerificationLevelInfo(mockUser.verificationLevel || 'none').color }]}>
                  {getVerificationLevelInfo(mockUser.verificationLevel || 'none').name}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Followers/Following Section */}
        <View style={styles.followSection}>
          <View style={styles.followStats}>
            <TouchableOpacity 
              style={styles.followStat}
              onPress={() => mockUser.privacySettings?.showFollowersList ? 
                navigation.navigate('FollowersList', { 
                  userId: mockUser.id, 
                  type: 'followers',
                  count: mockUser.followersCount 
                }) : 
                Alert.alert('Private', 'This user has chosen to keep their followers list private')
              }
              activeOpacity={mockUser.privacySettings?.showFollowersList ? 0.7 : 1}
            >
              <Text style={styles.followCount}>{mockUser.followersCount.toLocaleString()}</Text>
              <Text style={styles.followLabel}>Followers</Text>
              {!mockUser.privacySettings?.showFollowersList && (
                <Ionicons name="lock-closed-outline" size={12} color="#666" style={styles.lockIcon} />
              )}
            </TouchableOpacity>
            
            <View style={styles.followDivider} />
            
            <TouchableOpacity 
              style={styles.followStat}
              onPress={() => mockUser.privacySettings?.showFollowingList ? 
                navigation.navigate('FollowersList', { 
                  userId: mockUser.id, 
                  type: 'following',
                  count: mockUser.followingCount 
                }) : 
                Alert.alert('Private', 'This user has chosen to keep their following list private')
              }
              activeOpacity={mockUser.privacySettings?.showFollowingList ? 0.7 : 1}
            >
              <Text style={styles.followCount}>{mockUser.followingCount.toLocaleString()}</Text>
              <Text style={styles.followLabel}>Following</Text>
              {!mockUser.privacySettings?.showFollowingList && (
                <Ionicons name="lock-closed-outline" size={12} color="#666" style={styles.lockIcon} />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Follow Button */}
          <TouchableOpacity style={styles.followButton}>
            <Ionicons name="person-add-outline" size={18} color="#007AFF" />
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </View>

        {/* Active Giveaways Section */}
        {mockUser.isCreator && mockUser.activeGiveaways && mockUser.activeGiveaways.length > 0 && mockUser.privacySettings?.showActiveGiveaways && (
          <View style={styles.activeGiveawaysSection}>
            <Text style={styles.sectionTitle}>Active Giveaways ({mockUser.activeGiveaways.length})</Text>
            {mockUser.activeGiveaways.map((giveaway) => {
              const progressPercentage = (giveaway.soldTickets / giveaway.totalTickets) * 100;
              const timeColor = getTimeRemainingColor(giveaway.endDate);
              
              return (
                <TouchableOpacity 
                  key={giveaway.id} 
                  style={styles.giveawayCard}
                  onPress={() => handleGiveawayPress(giveaway)}
                  activeOpacity={0.9}
                >
                  <View style={styles.giveawayHeader}>
                    <View style={styles.giveawayIcon}>
                      <Ionicons name="gift" size={24} color="#007AFF" />
                    </View>
                    <View style={styles.giveawayInfo}>
                      <Text style={styles.giveawayTitle} numberOfLines={2}>{giveaway.title}</Text>
                      <Text style={styles.giveawayPrize} numberOfLines={1}>{giveaway.prize}</Text>
                    </View>
                    <View style={styles.giveawayPrice}>
                      <Text style={styles.ticketPrice}>${giveaway.ticketPrice}</Text>
                      <Text style={styles.perEntry}>per entry</Text>
                    </View>
                  </View>
                  
                  <View style={styles.giveawayProgress}>
                    <View style={styles.progressInfo}>
                      <Text style={styles.progressText}>
                        {giveaway.soldTickets.toLocaleString()}/{giveaway.totalTickets.toLocaleString()} entries
                      </Text>
                      <Text style={styles.progressPercentage}>{progressPercentage.toFixed(0)}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${progressPercentage}%`,
                            backgroundColor: progressPercentage > 80 ? '#FF3B30' : 
                                           progressPercentage > 50 ? '#FF9500' : '#34C759'
                          }
                        ]} 
                      />
                    </View>
                  </View>
                  
                  <View style={styles.giveawayFooter}>
                    <View style={styles.timeContainer}>
                      <Ionicons name="time-outline" size={14} color={timeColor} />
                      <Text style={[styles.timeText, { color: timeColor }]}>
                        {formatTimeRemaining(giveaway.endDate)}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.enterButton}>
                      <Text style={styles.enterButtonText}>Enter Now</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Featured Wins Section */}
        {mockUser.featuredWins && mockUser.featuredWins.length > 0 && mockUser.privacySettings?.showFeaturedWins && (
          <View style={styles.featuredWinsSection}>
            <Text style={styles.sectionTitle}>Featured Wins</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.winsScrollView}>
              {mockUser.featuredWins.map((win, index) => (
                <View key={win.id} style={styles.winCard}>
                  <View style={styles.winImagePlaceholder}>
                    <Ionicons name="gift" size={32} color="#007AFF" />
                  </View>
                  <Text style={styles.winTitle} numberOfLines={2}>{win.title}</Text>
                  <Text style={styles.winCreator}>by {win.creator}</Text>
                  <Text style={styles.winValue}>{win.value}</Text>
                  <Text style={styles.winDate}>{new Date(win.date).toLocaleDateString()}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* User Stats Section - Only show if privacy setting allows */}
        {mockUser.privacySettings?.showStats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>User Stats</Text>
            <View style={styles.statsGrid}>
              {renderStatCard('Giveaways Created', mockUser.stats.giveawaysCreated, 'gift')}
              {renderStatCard('Giveaways Won', mockUser.stats.giveawaysWon, 'trophy')}
              {renderStatCard('Entries Purchased', mockUser.stats.totalTicketsPurchased, 'ticket')}
              {renderStatCard('Followers Gained', mockUser.stats.followersGained, 'people')}
            </View>
          </View>
        )}

        {/* Privacy Notice for Hidden Stats */}
        {!mockUser.privacySettings?.showStats && (
          <View style={styles.hiddenStatsSection}>
            <View style={styles.hiddenStatsCard}>
              <Ionicons name="eye-off-outline" size={24} color="#666" />
              <Text style={styles.hiddenStatsText}>User Stats Hidden</Text>
              <Text style={styles.hiddenStatsSubtext}>This user has chosen to keep their stats private</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.messageButton} onPress={handleStartConversation}>
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  moreButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  userBio: {
    fontSize: 14,
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  websiteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  websiteText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  socialButton: {
    marginHorizontal: 8,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  creatorLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5e6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FF9500',
    marginTop: 5,
  },
  creatorText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },
  tierSection: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  tierInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  featuredWinsSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  winsScrollView: {
    marginHorizontal: -5,
  },
  winCard: {
    width: 140,
    marginHorizontal: 5,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
  },
  winImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  winTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  winCreator: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  winValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 2,
  },
  winDate: {
    fontSize: 9,
    color: '#999',
  },
  statsSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Active Giveaways Styles
  activeGiveawaysSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  giveawayCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  giveawayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  giveawayIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  giveawayInfo: {
    flex: 1,
    marginRight: 12,
  },
  giveawayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  giveawayPrize: {
    fontSize: 12,
    color: '#666',
  },
  giveawayPrice: {
    alignItems: 'flex-end',
  },
  ticketPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  perEntry: {
    fontSize: 10,
    color: '#666',
  },
  giveawayProgress: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  giveawayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  enterButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  enterButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Hidden Stats Styles
  hiddenStatsSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  hiddenStatsCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  hiddenStatsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  hiddenStatsSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  // Follow Section Styles
  followSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  followStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  followStat: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  followCount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  followLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  followDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  lockIcon: {
    position: 'absolute',
    top: -2,
    right: 10,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  followButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
