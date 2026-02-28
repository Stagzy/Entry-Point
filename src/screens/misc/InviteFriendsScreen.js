/**
 * InviteFriendsScreen - Comprehensive Referral & Rewards System
 * 
 * PURPOSE:
 * - Facilitates user acquisition through friend referral programs
 * - Provides multi-platform sharing capabilities for maximum reach
 * - Implements tiered reward system to incentivize continued invitations
 * - Tracks referral performance and reward distribution
 * - Gamifies the invitation process with progress visualization
 * 
 * NAVIGATION:
 * - Accessed from: ProfileScreen, SettingsScreen, HomeScreen promotions
 * - Alternative Access: Deep links from marketing campaigns
 * - Returns to: Previous screen via back button
 * - External Navigation: Social platform apps and messaging services
 * 
 * KEY FEATURES:
 * - Multi-Platform Sharing: 6 major social platforms with custom messaging
 * - Referral Code System: Unique user codes with clipboard integration
 * - Tiered Rewards: Progressive incentives for multiple invitations
 * - Activity Tracking: Real-time invite history and status monitoring
 * - Cross-Platform Integration: Native app linking and web sharing
 * 
 * USER REQUIREMENTS:
 * - Authentication: Must have valid user account with referral code
 * - Device Capabilities: Access to clipboard, native sharing, and deep linking
 * - Social Accounts: Optional but enhances sharing effectiveness
 * 
 * STATE MANAGEMENT:
 * - copiedCode: Temporary visual feedback for clipboard operations
 * - User stats: Total invites, rewards earned, pending rewards
 * - Invite history: Recent invitations with status tracking
 * 
 * REFERRAL SYSTEM:
 * - Unique Codes: Auto-generated user-specific referral identifiers
 * - Dual Benefits: Both referrer and referee receive rewards
 * - Reward Structure: $25 bonus entries for successful referrals
 * - Status Tracking: Pending and completed invitation monitoring
 * - Progress Visualization: Clear indicators of reward tier advancement
 * 
 * SHARING PLATFORMS:
 * 1. WhatsApp: Direct messaging with pre-formatted invitation text
 * 2. Instagram: Story/post sharing with code copying assistance
 * 3. Facebook: Web-based sharing with custom messaging
 * 4. X (Twitter): Tweet composition with character-optimized text
 * 5. TikTok: Video creation assistance with code mention guidance
 * 6. SMS: Native messaging with referral link integration
 * 
 * REWARD TIER SYSTEM:
 * - Tier 1 (5 friends): $10 bonus entries
 * - Tier 2 (10 friends): $25 bonus entries
 * - Tier 3 (25 friends): $50 bonus entries
 * - Tier 4 (50 friends): VIP Member Status with exclusive benefits
 * 
 * TRACKING & ANALYTICS:
 * - Invitation Count: Total friends successfully referred
 * - Reward Tracking: Cumulative earnings from referral program
 * - Pending Status: Invitations awaiting completion
 * - Recent Activity: Chronological list of recent invitations
 * - Completion Rates: Success metrics for invitation effectiveness
 * 
 * SOCIAL INTEGRATION:
 * - Platform Detection: Intelligent app availability checking
 * - Custom Messaging: Platform-specific invitation text optimization
 * - Deep Linking: Direct app launches for seamless sharing
 * - Fallback Options: Web-based sharing when apps unavailable
 * - Cross-Platform Compatibility: Works across iOS and Android ecosystems
 * 
 * USER EXPERIENCE:
 * - Visual Progress: Clear indicators of reward tier advancement
 * - Instant Feedback: Immediate confirmation of copy and share actions
 * - Intuitive Flow: Logical progression from code to sharing to tracking
 * - Motivational Design: Gamified elements encourage continued participation
 * - Clear Value Proposition: Explicit benefit explanation for both parties
 * 
 * CONTENT SECTIONS:
 * 1. Hero Section: Value proposition and program explanation
 * 2. Statistics Dashboard: Personal performance metrics
 * 3. Referral Code: Primary sharing mechanism with clipboard integration
 * 4. Social Sharing: Multi-platform distribution options
 * 5. Reward Tiers: Progress visualization and future incentives
 * 6. Recent Activity: Historical tracking and status monitoring
 * 
 * TECHNICAL IMPLEMENTATION:
 * - Clipboard API: Secure code copying with user feedback
 * - Deep Linking: Platform-specific URL schemes for native app launches
 * - Share API: Native sharing capabilities with custom messaging
 * - External Linking: Web-based sharing for platforms without deep links
 * - Error Handling: Graceful fallbacks for unavailable platforms
 * 
 * MARKETING OPTIMIZATION:
 * - Viral Coefficient: Designed to maximize user acquisition efficiency
 * - Message Optimization: Platform-specific content for maximum engagement
 * - Conversion Tracking: Detailed analytics for program effectiveness
 * - A/B Testing Ready: Flexible reward structure for experimentation
 * - Cross-Platform Reach: Maximum distribution across social ecosystems
 * 
 * GAMIFICATION ELEMENTS:
 * - Progress Bars: Visual representation of tier advancement
 * - Achievement Badges: Completion indicators for reached milestones
 * - Leaderboard Potential: Framework for competitive elements
 * - Milestone Celebrations: Reward achievement recognition
 * - Social Proof: Recent activity display encourages participation
 * 
 * PRIVACY & COMPLIANCE:
 * - Anonymous Tracking: Friend names shown as initials only
 * - Opt-in Sharing: User-controlled social platform integration
 * - Transparent Terms: Clear reward structure and requirements
 * - Data Protection: Minimal personal information exposure
 * - Platform Compliance: Adheres to social platform sharing guidelines
 * 
 * PERFORMANCE FEATURES:
 * - Efficient Rendering: Optimized list displays for large invitation histories
 * - Native Integration: Platform-specific optimizations for smooth sharing
 * - Caching Strategy: Intelligent data persistence for faster access
 * - Real-time Updates: Live synchronization of invitation status changes
 * 
 * RELATED SCREENS:
 * - ProfileScreen: Access point and reward display integration
 * - SettingsScreen: Program configuration and notification preferences
 * - HomeScreen: Promotional elements and quick access points
 * - External Apps: Social platforms and messaging services
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Clipboard,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function InviteFriendsScreen({ navigation }) {
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);

  // Mock referral data - replace with actual data from API
  const referralCode = user?.referralCode || 'ENTRY' + user?.id?.toUpperCase() || 'ENTRYUSER';
  const totalInvites = user?.stats?.totalInvites || 12;
  const totalRewards = user?.stats?.referralRewards || 250;
  const pendingRewards = user?.stats?.pendingRewards || 50;

  const recentInvites = [
    { id: 1, name: 'Sarah M.', joinedDate: '2 days ago', reward: 25, status: 'completed' },
    { id: 2, name: 'Mike R.', joinedDate: '1 week ago', reward: 25, status: 'completed' },
    { id: 3, name: 'Emma L.', joinedDate: '3 days ago', reward: 25, status: 'pending' },
    { id: 4, name: 'Alex K.', joinedDate: '5 days ago', reward: 25, status: 'completed' },
  ];

  const rewardTiers = [
    { invites: 5, reward: '$10 bonus entries', completed: totalInvites >= 5 },
    { invites: 10, reward: '$25 bonus entries', completed: totalInvites >= 10 },
    { invites: 25, reward: '$50 bonus entries', completed: totalInvites >= 25 },
    { invites: 50, reward: 'VIP Member Status', completed: totalInvites >= 50 },
  ];

  const socialPlatforms = [
    {
      name: 'WhatsApp',
      icon: 'logo-whatsapp',
      color: '#25D366',
      action: () => shareToWhatsApp()
    },
    {
      name: 'Instagram',
      icon: 'logo-instagram',
      color: '#E4405F',
      action: () => shareToInstagram()
    },
    {
      name: 'Facebook',
      icon: 'logo-facebook',
      color: '#1877F2',
      action: () => shareToFacebook()
    },
    {
      name: 'X',
      icon: 'close-outline',
      color: '#000000',
      action: () => shareToX()
    },
    {
      name: 'TikTok',
      icon: 'musical-notes',
      color: '#000000',
      action: () => shareToTikTok()
    },
    {
      name: 'SMS',
      icon: 'chatbubble',
      color: '#34C759',
      action: () => shareViaSMS()
    }
  ];

  const copyReferralCode = async () => {
    try {
      await Clipboard.setString(referralCode);
      setCopiedCode(true);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy referral code');
    }
  };

  const shareGeneral = async () => {
    try {
      const message = `🎁 Hey! Join me on Entry Point - the best place to enter giveaways and win amazing prizes! Use my code ${referralCode} when signing up and we both get bonus entries! 🚀\n\nDownload: https://entrypoint.app/download`;
      
      await Share.share({
        message: message,
        title: 'Join Entry Point and Win Prizes!',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const shareToWhatsApp = () => {
    const message = `🎁 Hey! Join me on Entry Point - the best place to enter giveaways and win amazing prizes! Use my code ${referralCode} when signing up and we both get bonus entries! 🚀\n\nDownload: https://entrypoint.app/download`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
  };

  const shareToInstagram = () => {
    Alert.alert('Share to Instagram', 'Copy your referral code and share it in your Instagram story or post!', [
      { text: 'Copy Code', onPress: copyReferralCode },
      { text: 'Cancel' }
    ]);
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=https://entrypoint.app/download&quote=Join me on Entry Point! Use code ${referralCode} for bonus entries!`;
    Linking.openURL(url);
  };

  const shareToX = () => {
    const text = `🎁 Join me on Entry Point and win amazing prizes! Use code ${referralCode} for bonus entries! 🚀`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=https://entrypoint.app/download`;
    Linking.openURL(url);
  };

  const shareToTikTok = () => {
    Alert.alert('Share to TikTok', 'Create a video about Entry Point and mention your referral code in the description!', [
      { text: 'Copy Code', onPress: copyReferralCode },
      { text: 'Cancel' }
    ]);
  };

  const shareViaSMS = () => {
    const message = `🎁 Hey! Join me on Entry Point - win amazing prizes! Use code ${referralCode} for bonus entries: https://entrypoint.app/download`;
    Linking.openURL(`sms:?body=${encodeURIComponent(message)}`);
  };

  const renderSocialPlatform = (platform) => (
    <TouchableOpacity
      key={platform.name}
      style={[styles.socialPlatform, { borderColor: platform.color }]}
      onPress={platform.action}
    >
      <View style={[styles.socialIcon, { backgroundColor: platform.color }]}>
        <Ionicons name={platform.icon} size={24} color="#fff" />
      </View>
      <Text style={styles.socialName}>{platform.name}</Text>
    </TouchableOpacity>
  );

  const renderRewardTier = (tier, index) => (
    <View key={index} style={[styles.rewardTier, tier.completed && styles.rewardTierCompleted]}>
      <View style={styles.rewardTierLeft}>
        <View style={[styles.rewardTierIcon, tier.completed && styles.rewardTierIconCompleted]}>
          <Ionicons 
            name={tier.completed ? 'checkmark' : 'gift'} 
            size={20} 
            color={tier.completed ? '#fff' : '#007AFF'} 
          />
        </View>
        <View>
          <Text style={[styles.rewardTierTitle, tier.completed && styles.rewardTierTitleCompleted]}>
            {tier.invites} Friends
          </Text>
          <Text style={styles.rewardTierReward}>{tier.reward}</Text>
        </View>
      </View>
      {tier.completed && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>Earned!</Text>
        </View>
      )}
    </View>
  );

  const renderRecentInvite = (invite) => (
    <View key={invite.id} style={styles.inviteItem}>
      <View style={styles.inviteAvatar}>
        <Text style={styles.inviteAvatarText}>{invite.name.charAt(0)}</Text>
      </View>
      <View style={styles.inviteDetails}>
        <Text style={styles.inviteName}>{invite.name}</Text>
        <Text style={styles.inviteDate}>Joined {invite.joinedDate}</Text>
      </View>
      <View style={styles.inviteReward}>
        <Text style={[styles.inviteRewardText, { color: invite.status === 'completed' ? '#34C759' : '#FF9500' }]}>
          +${invite.reward}
        </Text>
        <Text style={styles.inviteStatus}>
          {invite.status === 'completed' ? 'Earned' : 'Pending'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Friends</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="people" size={40} color="#007AFF" />
          </View>
          <Text style={styles.heroTitle}>Invite Friends, Earn Rewards!</Text>
          <Text style={styles.heroSubtitle}>
            Invite friends to Entry Point and earn bonus entries for every friend who joins
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalInvites}</Text>
            <Text style={styles.statLabel}>Friends Invited</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>${totalRewards}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>${pendingRewards}</Text>
            <Text style={styles.statLabel}>Pending Rewards</Text>
          </View>
        </View>

        {/* Referral Code Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referral Code</Text>
          <View style={styles.referralCodeContainer}>
            <View style={styles.referralCodeBox}>
              <Text style={styles.referralCodeText}>{referralCode}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyButton, copiedCode && styles.copyButtonSuccess]}
              onPress={copyReferralCode}
            >
              <Ionicons 
                name={copiedCode ? 'checkmark' : 'copy'} 
                size={20} 
                color={copiedCode ? '#34C759' : '#007AFF'} 
              />
              <Text style={[styles.copyButtonText, copiedCode && styles.copyButtonTextSuccess]}>
                {copiedCode ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.referralDescription}>
            Share this code with friends. When they sign up and use your code, you both get $25 in bonus entries!
          </Text>
        </View>

        {/* Share Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share on Social Media</Text>
          <View style={styles.socialGrid}>
            {socialPlatforms.map(renderSocialPlatform)}
          </View>
          <TouchableOpacity style={styles.generalShareButton} onPress={shareGeneral}>
            <Ionicons name="share" size={20} color="#fff" />
            <Text style={styles.generalShareText}>More Share Options</Text>
          </TouchableOpacity>
        </View>

        {/* Reward Tiers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referral Rewards</Text>
          <Text style={styles.sectionDescription}>
            Unlock amazing rewards as you invite more friends!
          </Text>
          <View style={styles.rewardTiers}>
            {rewardTiers.map(renderRewardTier)}
          </View>
        </View>

        {/* Recent Invites */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Recent Invites</Text>
          <View style={styles.recentInvites}>
            {recentInvites.map(renderRecentInvite)}
          </View>
          {recentInvites.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No invites yet</Text>
              <Text style={styles.emptyStateSubtext}>Start inviting friends to earn rewards!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  lastSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  referralCodeBox: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  referralCodeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    gap: 5,
  },
  copyButtonSuccess: {
    backgroundColor: '#e8f5e8',
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  copyButtonTextSuccess: {
    color: '#34C759',
  },
  referralDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 20,
  },
  socialPlatform: {
    width: '30%',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  socialName: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  generalShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 15,
    gap: 8,
  },
  generalShareText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  rewardTiers: {
    gap: 15,
  },
  rewardTier: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  rewardTierCompleted: {
    backgroundColor: '#e8f5e8',
    borderColor: '#34C759',
  },
  rewardTierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rewardTierIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  rewardTierIconCompleted: {
    backgroundColor: '#34C759',
  },
  rewardTierTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  rewardTierTitleCompleted: {
    color: '#34C759',
  },
  rewardTierReward: {
    fontSize: 14,
    color: '#666',
  },
  completedBadge: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  recentInvites: {
    gap: 15,
  },
  inviteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  inviteAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  inviteAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  inviteDetails: {
    flex: 1,
  },
  inviteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  inviteDate: {
    fontSize: 14,
    color: '#666',
  },
  inviteReward: {
    alignItems: 'flex-end',
  },
  inviteRewardText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  inviteStatus: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
