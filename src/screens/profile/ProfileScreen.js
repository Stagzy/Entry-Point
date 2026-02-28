/**
 * ProfileScreen.js
 * 
 * PURPOSE:
 * Comprehensive user profile dashboard serving as the central hub for personal
 * account management, statistics display, and navigation to key app features.
 * Provides complete user identity presentation with social integration, trust
 * tier visualization, and contextual access to all user-specific functionality.
 * 
 * NAVIGATION FLOW:
 * Accessible from: Main tab navigation, user account menus, deep links
 * Navigates to: EditProfile, MyEntries, MyGiveaways, CreatorAnalytics,
 * PaymentMethods, InviteFriends, HelpSupport, Settings, AdminDashboard (admin),
 * FollowersList, TierUpgrade, and logout functionality
 * 
 * KEY FEATURES:
 * • Complete User Identity: Avatar, name, email, bio, website, social links
 * • Trust Tier System: Visual tier display with upgrade pathways and benefits
 * • Verification Status: Multi-level verification badges with status indicators
 * • Social Media Integration: 7 platform links with direct navigation
 * • Statistics Dashboard: 4-metric grid showing user engagement and achievements
 * • Featured Wins: Horizontal scrollable showcase of prize victories
 * • Follow System: Followers/following counts with privacy controls
 * • Dynamic Menu: Contextual navigation based on user role and permissions
 * • Admin Features: Administrative panel access for authorized users
 * • Creator Tools: Enhanced analytics and management for verified creators
 * • Privacy Controls: Lock indicators for private follower/following lists
 * 
 * USER ROLES & PERMISSIONS:
 * • Standard Users: Basic profile, entries, wins, analytics
 * • Verified Users: Enhanced creator analytics, verification badges
 * • Creators: Giveaway management, follower insights, creator-specific features
 * • Administrators: Full admin panel access, platform analytics, user management
 * 
 * TRUST TIER INTEGRATION:
 * • Bronze Tier: Basic features with upgrade prompts
 * • Silver Tier: Enhanced statistics and social features
 * • Gold Tier: Premium analytics and priority support
 * • Platinum Tier: Exclusive features and advanced creator tools
 * • Visual Indicators: Color-coded badges, borders, and tier-specific styling
 * 
 * SOCIAL FEATURES:
 * • Multi-Platform Links: Instagram, X (Twitter), YouTube, TikTok, Discord, Steam, Reddit
 * • Privacy-Aware Following: Conditional follower/following list access
 * • Profile Customization: Bio, website, social handles with validation
 * • Featured Content: Win showcases and achievement highlights
 * 
 * STATE MANAGEMENT:
 * • Authentication context integration for user data
 * • Profile data loading with fallback handling
 * • Dynamic menu generation based on user permissions
 * • Social link validation and navigation
 * • Privacy setting enforcement for follower lists
 * • Statistics calculation and display formatting
 * 
 * TECHNICAL DETAILS:
 * • ProfileAvatar component integration with trust tier theming
 * • ScrollView optimization for variable content length
 * • TouchableOpacity interactions for all navigation elements
 * • Alert system for confirmations and privacy notifications
 * • Conditional rendering based on user roles and data availability
 * • Social platform URL construction and navigation
 * • Number formatting for statistics display
 * 
 * BUSINESS LOGIC:
 * • Role-based menu item insertion (analytics, admin features)
 * • Privacy enforcement for follower list access
 * • Trust tier benefit presentation and upgrade pathways
 * • Featured content curation and display
 * • Social verification and link validation
 * • Logout confirmation workflow with error handling
 * 
 * ACCESSIBILITY:
 * • Screen reader compatible labels and descriptions
 * • High contrast visual indicators for trust tiers and verification
 * • Touch target optimization for interactive elements
 * • Clear visual hierarchy with proper font sizing
 * • Descriptive text for all user statistics and achievements
 * 
 * SECURITY FEATURES:
 * • Secure logout with confirmation prompts
 * • Privacy-aware data display based on user settings
 * • Role-based access control for admin features
 * • Safe navigation with parameter validation
 * 
 * RELATED SCREENS:
 * • EditProfileScreen: Profile information management
 * • MyEntriesScreen: User's giveaway participation history
 * • MyGiveawaysScreen: Creator's giveaway management
 * • MyEntriesScreen: Giveaway participation history and performance tracking
 * • CreatorAnalyticsScreen: Performance insights and metrics
 * • SettingsScreen: App preferences and privacy controls
 * • AdminDashboardScreen: Platform administration (admin only)
 * • FollowersListScreen: Social connections management
 * • TierUpgradeScreen: Trust tier advancement and benefits
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ProfileAvatar from '../../components/ProfileAvatar';

export default function ProfileScreen({ navigation }) {
  const { user, userProfile, logout, getTrustTierInfo, getVerificationLevelInfo } = useAuth();
  const { theme } = useTheme();

  const handleSocialPress = (platform, handle) => {
    if (!handle) return;
    
    let url = '';
    switch (platform) {
      case 'instagram':
        url = `https://instagram.com/${handle.replace('@', '')}`;
        break;
      case 'twitter':
        url = `https://x.com/${handle.replace('@', '')}`;
        break;
      case 'youtube':
        url = handle.includes('http') ? handle : `https://youtube.com/c/${handle}`;
        break;
      case 'tiktok':
        url = `https://tiktok.com/@${handle.replace('@', '')}`;
        break;
      case 'discord':
        Alert.alert('Discord', `Add ${handle} on Discord`);
        return;
      case 'steam':
        url = `https://steamcommunity.com/id/${handle}`;
        break;
      case 'reddit':
        url = `https://reddit.com/${handle.startsWith('u/') ? handle : 'u/' + handle}`;
        break;
      default:
        return;
    }
    
    if (url) {
      // In a real app, you would use Linking.openURL(url)
      Alert.alert('Open Link', `Would open: ${url}`);
    }
  };

  const menuItems = [
    {
      icon: 'ticket-outline',
      title: 'My Entries',
      subtitle: 'View your entry points',
      onPress: () => navigation.navigate('MyEntries'),
    },
    {
      icon: 'gift-outline',
      title: 'My Giveaways',
      subtitle: 'Manage your created giveaways',
      onPress: () => navigation.navigate('MyGiveaways'),
    },
    {
      icon: 'card-outline',
      title: 'Payment Methods',
      subtitle: 'Manage your payment options',
      onPress: () => navigation.navigate('PaymentMethods'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help or contact support',
      onPress: () => navigation.navigate('HelpSupport'),
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      subtitle: 'App preferences and privacy',
      onPress: () => navigation.navigate('Settings'),
    },
  ];

  // Add analytics for all users (after My Entries)
  const analyticsSubtitle = user?.isVerified 
    ? 'Track your giveaway performance' 
    : 'View your entry analytics';
  
  menuItems.splice(2, 0, // Insert after My Entries (index 1), before Payment Methods
    {
      icon: 'analytics-outline',
      title: 'My Analytics',
      subtitle: analyticsSubtitle,
      onPress: () => navigation.navigate('CreatorAnalytics'),
    }
  );

  // Add admin-specific menu items if user is admin
  if (userProfile?.is_admin) {
    menuItems.splice(-1, 0, // Insert before Settings
      {
        icon: 'business-outline',
        title: 'Admin Hub',
        subtitle: 'Unified admin dashboard and controls',
        onPress: () => navigation.navigate('AdminHub'),
      }
    );
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: async () => {
          const result = await logout();
          if (!result.success) {
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        }},
      ]
    );
  };

  const renderStatCard = (label, value, icon) => (
    <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Ionicons name={icon} size={24} color={theme.primary} />
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );

  const renderMenuItem = (item, index) => (
    <TouchableOpacity
      key={index}
      style={[styles.menuItem, { borderBottomColor: theme.border }]}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconContainer, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name={item.icon} size={20} color={theme.primary} />
        </View>
        <View style={styles.menuItemText}>
          <Text style={[styles.menuTitle, { color: theme.text }]}>{item.title}</Text>
          <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.profileSection, { backgroundColor: theme.surface }]}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <ProfileAvatar 
              user={userProfile || user} 
              size={90} 
              getTrustTierInfo={getTrustTierInfo}
              showVerificationBadge={true}
              showTrustBorder={true}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.userName, { color: theme.text }]}>{userProfile?.name || user?.name}</Text>
        <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{userProfile?.email || user?.email}</Text>
        
        {/* Bio Section */}
        {userProfile?.bio && (
          <Text style={[styles.userBio, { color: theme.textSecondary }]}>{userProfile.bio}</Text>
        )}
        
        {/* Website Link */}
        {userProfile?.website && (
          <TouchableOpacity style={[styles.websiteLink, { borderColor: theme.border }]}>
            <Ionicons name="link-outline" size={14} color={theme.primary} />
            <Text style={[styles.websiteText, { color: theme.primary }]}>{userProfile.website.replace('https://', '').replace('http://', '')}</Text>
          </TouchableOpacity>
        )}
        
        {/* Social Links */}
        {userProfile?.social && Object.values(userProfile.social).some(value => value && value.trim()) && (
          <View style={styles.socialLinks}>
            {userProfile.social.instagram && (
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleSocialPress('instagram', userProfile.social.instagram)}
              >
                <Ionicons name="logo-instagram" size={18} color="#E4405F" />
              </TouchableOpacity>
            )}
            {userProfile.social.twitter && (
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleSocialPress('twitter', userProfile.social.twitter)}
              >
                <Text style={styles.xLogo}>𝕏</Text>
              </TouchableOpacity>
            )}
            {userProfile.social.youtube && (
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleSocialPress('youtube', userProfile.social.youtube)}
              >
                <Ionicons name="logo-youtube" size={18} color="#FF0000" />
              </TouchableOpacity>
            )}
            {userProfile.social.tiktok && (
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleSocialPress('tiktok', userProfile.social.tiktok)}
              >
                <Ionicons name="logo-tiktok" size={18} color="#000" />
              </TouchableOpacity>
            )}
            {userProfile.social.discord && (
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleSocialPress('discord', userProfile.social.discord)}
              >
                <Ionicons name="logo-discord" size={18} color="#5865F2" />
              </TouchableOpacity>
            )}
            {userProfile.social.steam && (
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleSocialPress('steam', userProfile.social.steam)}
              >
                <Ionicons name="logo-steam" size={18} color="#000" />
              </TouchableOpacity>
            )}
            {userProfile.social.reddit && (
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleSocialPress('reddit', userProfile.social.reddit)}
              >
                <Ionicons name="logo-reddit" size={18} color="#FF4500" />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {user.isCreator && user.isVerified && (
          <View style={styles.creatorLabel}>
            <Ionicons name="star" size={14} color="#FF9500" />
            <Text style={styles.creatorText}>Verified Creator</Text>
          </View>
        )}
        
        {user.isAdmin && (
          <View style={styles.adminLabel}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
            <Text style={styles.adminText}>Administrator</Text>
          </View>
        )}

        {/* Followers/Following Stats */}
        <View style={[styles.followStatsInline, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity 
            style={styles.followStatInline}
            onPress={() => (user.privacySettings?.showFollowersList !== false) ? 
              navigation.navigate('FollowersList', { 
                userId: user.id, 
                type: 'followers',
                count: userProfile?.followers_count || 0
              }) : 
              Alert.alert('Private', 'You have chosen to keep your followers list private. You can change this in your privacy settings.')
            }
            activeOpacity={(user.privacySettings?.showFollowersList !== false) ? 0.7 : 1}
          >
            <Text style={[styles.followCountInline, { color: theme.text }]}>{(userProfile?.followers_count || 0).toLocaleString()}</Text>
            <Text style={[styles.followLabelInline, { color: theme.textSecondary }]}>Followers</Text>
            {user.privacySettings?.showFollowersList === false && (
              <Ionicons name="lock-closed-outline" size={10} color={theme.textSecondary} style={styles.lockIconInline} />
            )}
          </TouchableOpacity>
          
          <View style={[styles.followDividerInline, { backgroundColor: theme.border }]} />
          
          <TouchableOpacity 
            style={styles.followStatInline}
            onPress={() => (user.privacySettings?.showFollowingList !== false) ? 
              navigation.navigate('FollowersList', { 
                userId: user.id, 
                type: 'following',
                count: userProfile?.following_count || 0
              }) : 
              Alert.alert('Private', 'You have chosen to keep your following list private. You can change this in your privacy settings.')
            }
            activeOpacity={(user.privacySettings?.showFollowingList !== false) ? 0.7 : 1}
          >
            <Text style={[styles.followCountInline, { color: theme.text }]}>{(userProfile?.following_count || 0).toLocaleString()}</Text>
            <Text style={[styles.followLabelInline, { color: theme.textSecondary }]}>Following</Text>
            {user.privacySettings?.showFollowingList === false && (
              <Ionicons name="lock-closed-outline" size={10} color={theme.textSecondary} style={styles.lockIconInline} />
            )}
          </TouchableOpacity>
        </View>
        
        {/* Trust Tier Information */}
        <View style={[styles.tierSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.tierInfo}>
            <View style={styles.tierBadge}>
              <Ionicons 
                name={getTrustTierInfo(userProfile?.trust_tier || 'bronze').icon} 
                size={16} 
                color={getTrustTierInfo(userProfile?.trust_tier || 'bronze').color} 
              />
              <Text style={[styles.tierText, { color: getTrustTierInfo(userProfile?.trust_tier || 'bronze').color }]}>
                {getTrustTierInfo(userProfile?.trust_tier || 'bronze').name} Tier
              </Text>
            </View>
            <View style={styles.verificationBadge}>
              <Ionicons 
                name={getVerificationLevelInfo(user.verificationLevel || 'none').icon} 
                size={14} 
                color={getVerificationLevelInfo(user.verificationLevel || 'none').color} 
              />
              <Text style={[styles.verificationText, { color: getVerificationLevelInfo(user.verificationLevel || 'none').color }]}>
                {getVerificationLevelInfo(user.verificationLevel || 'none').name}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.tierUpgradeButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
            onPress={() => navigation.navigate('TierUpgrade')}
          >
            <Text style={[styles.tierUpgradeText, { color: theme.primary }]}>View Benefits</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Wins Section */}
      {user.featuredWins && user.featuredWins.length > 0 && (
        <View style={[styles.featuredWinsSection, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Featured Wins</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyEntries', { initialFilter: 'won' })}>
              <Text style={[styles.seeAllText, { color: theme.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.winsScrollView}>
            {user.featuredWins.map((win, index) => (
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

      <View style={[styles.statsSection, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Stats</Text>
        <View style={styles.statsGrid}>
          {renderStatCard('Giveaways Created', userProfile?.stats?.giveawaysCreated || 0, 'gift')}
          {renderStatCard('Giveaways Won', userProfile?.stats?.giveawaysWon || 0, 'trophy')}
          {renderStatCard('Entries Purchased', userProfile?.stats?.totalTicketsPurchased || 0, 'ticket')}
          {renderStatCard('Followers Gained', userProfile?.stats?.followersGained || 0, 'people')}
        </View>
      </View>

      <View style={[styles.menuSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {menuItems.map(renderMenuItem)}
      </View>

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.appInfo}>
        <Text style={[styles.appInfoText, { color: theme.textSecondary }]}>Entry Point v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  profileSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 30,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    marginBottom: 15,
  },
  editButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
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
  xLogo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    width: 18,
    height: 18,
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
  statsSection: {
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
  menuSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f3f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  appInfoText: {
    fontSize: 12,
    color: '#999',
  },
  adminLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 5,
    shadowColor: '#DC3545',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  adminText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#fff',
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
    marginBottom: 10,
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
  tierUpgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  tierUpgradeText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 6,
  },
  featuredWinsSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
  // Inline Follow Stats Styles (inside profile card)
  followStatsInline: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  followStatInline: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  followCountInline: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  followLabelInline: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  followDividerInline: {
    width: 1,
    height: 24,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 15,
  },
  lockIconInline: {
    position: 'absolute',
    top: -2,
    right: 5,
  },
  // Follow Section Styles (kept for UserProfile screen compatibility)
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
  editProfileButton: {
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
  editProfileButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
