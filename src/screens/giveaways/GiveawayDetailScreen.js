/**
 * GiveawayDetailScreen - Comprehensive Giveaway Interaction Hub
 * 
 * PURPOSE:
 * - Displays complete giveaway information with real-time updates
 * - Enables ticket purchasing, social media interactions, and community engagement
 * - Provides advanced commenting system with moderation capabilities
 * - Shows delivery options, progress tracking, and live activity feeds
 * 
 * NAVIGATION:
 * - Accessed from: GiveawaysScreen, HomeScreen, MyGiveawaysScreen (giveaway card tap)
 * - Route Params: { giveaway: object } - Initial giveaway data
 * - Navigates to: TicketPurchaseScreen, UserProfileScreen
 * - Related: Creator profile, participant profiles via comments
 * 
 * KEY FEATURES:
 * - Real-time Updates: Live ticket sales, progress, and activity feeds
 * - Social Requirements: Platform-specific follow actions for bonus entries
 * - Advanced Commenting: Threaded replies, moderation, creator badges
 * - Delivery Management: Multiple shipping options, pickup locations
 * - Progress Visualization: Dynamic progress bars and statistics
 * - Content Moderation: Auto-filtering for inappropriate content
 * - Live Activity Feed: Recent entries and user interactions
 * 
 * USER REQUIREMENTS:
 * - Authentication: Required for commenting and ticket purchases
 * - Verification: Some features enhanced for verified users
 * - Social Integration: External app linking for follow verification
 * 
 * STATE MANAGEMENT:
 * - giveaway: Complete giveaway data with detailed information
 * - liveData: Real-time updates from useRealtimeGiveaway hook
 * - comments: Comment thread system with replies and moderation
 * - userTickets: Current user's ticket count for this giveaway
 * - moderation: Reported users, shadow bans, content filtering
 * 
 * REAL-TIME FEATURES:
 * - Live Ticket Sales: Updates sold count and progress in real-time
 * - Activity Feed: Shows recent entries and user interactions
 * - Progress Tracking: Dynamic progress bars with live statistics
 * - Status Indicators: Live update indicator when connected
 * 
 * SOCIAL INTEGRATION:
 * - Dynamic Requirements: Based on creator's linked social platforms
 * - Follow Verification: External app integration for follow confirmation
 * - Bonus Entries: Platform-specific entry rewards (3-10 entries)
 * - Multi-platform Support: Instagram, YouTube, Twitter, TikTok, Discord, Steam, Reddit
 * 
 * COMMENTING SYSTEM:
 * - Threaded Replies: Full conversation support with nested replies
 * - Creator Badges: Special highlighting for creator responses
 * - Auto-Moderation: Advanced content filtering for profanity, spam, hate speech
 * - Reporting System: User reporting with automated shadow banning
 * - Character Limits: 500 character limit with real-time counter
 * - Admin Features: Special moderation tools for admin users
 * 
 * DELIVERY OPTIONS:
 * - Multiple Methods: US shipping, international shipping, local pickup
 * - Pickup Locations: Detailed location info with directions integration
 * - Delivery Notes: Custom shipping instructions and timelines
 * - Hybrid Options: Combined shipping and pickup availability
 * 
 * MODERATION SYSTEM:
 * - Content Filtering: Profanity, spam, scam, hate speech detection
 * - Character Analysis: Excessive caps, repeats, emoji detection
 * - URL Blocking: Prevents external link sharing for security
 * - Shadow Banning: Invisible restriction for problematic users
 * - Reporting: User-driven content flagging with automated responses
 * 
 * PROGRESS VISUALIZATION:
 * - Dynamic Progress Bar: Real-time visual representation of sales
 * - Statistics Display: Ticket price, sold count, days remaining
 * - Live Stats Bar: Shows recent changes and momentum
 * - User Tickets: Personal ticket count display
 * 
 * TECHNICAL DETAILS:
 * - Real-time Hook: useRealtimeGiveaway for live data updates
 * - Image Optimization: Optimized header image display
 * - Performance: Efficient comment rendering and moderation
 * - Accessibility: Proper touch targets and semantic markup
 * - Error Handling: Graceful fallbacks for failed API calls
 * 
 * RELATED SCREENS:
 * - TicketPurchaseScreen: Ticket buying flow
 * - UserProfileScreen: Creator and participant profiles
 * - GiveawaysScreen: Source navigation for giveaway discovery
 * - HomeScreen: Featured giveaway access point
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Share,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRealtimeGiveaway } from '../../hooks/useRealtime';
import api, { giveawayService, commentService, socialMediaService } from '../../services/api';
import ProfileAvatar from '../../components/ProfileAvatar';
import LiveActivityFeed, { LiveStatsBar } from '../../components/LiveActivityFeed';
import AMOEForm from '../../components/AMOEForm';
import OfficialRules from '../../components/OfficialRules';
import FairnessProofModal from '../../components/FairnessProofModal';
import HowItWorksModal from '../../components/HowItWorksModal';

export default function GiveawayDetailScreen({ route, navigation }) {
  const { giveaway: initialGiveaway } = route.params;
  const { user, getTrustTierInfo } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // State for detailed giveaway data
  const [giveaway, setGiveaway] = useState(initialGiveaway);
  const [loading, setLoading] = useState(false);
  
  // Real-time giveaway data
  const { liveData, refresh, isSubscribed } = useRealtimeGiveaway(giveaway);
  
  const [userTickets, setUserTickets] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showLiveActivity, setShowLiveActivity] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [reportedUsers, setReportedUsers] = useState(new Set());
  const [shadowBannedUsers, setShadowBannedUsers] = useState(new Set());
  const [showAMOEForm, setShowAMOEForm] = useState(false);
  const [showOfficialRules, setShowOfficialRules] = useState(false);
  const [showFairnessProof, setShowFairnessProof] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  // Dynamic data loaded from services
  const [creatorSocial, setCreatorSocial] = useState({});
  const [deliveryMethod, setDeliveryMethod] = useState({});
  const [socialRequirements, setSocialRequirements] = useState([]);

  // Load detailed giveaway data on mount
  useEffect(() => {
    loadDetailedGiveawayData();
    loadComments();
  }, [initialGiveaway.id]);

  // Load creator social media data when giveaway data is available
  useEffect(() => {
    if (giveaway.creatorId) {
      loadCreatorSocialMedia();
    }
  }, [giveaway.creatorId]);

  const loadDetailedGiveawayData = async () => {
    if (!initialGiveaway.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await giveawayService.getGiveawayById(initialGiveaway.id);
      if (data) {
        setGiveaway(data);
        setCreatorSocial(data.creatorSocial || {});
        setDeliveryMethod(data.deliveryMethod || {});
        // Build social requirements from creator's linked accounts
        buildSocialRequirements(data.creatorSocial || {});
      } else if (error) {
        console.error('Error loading giveaway details:', error);
      }
    } catch (error) {
      console.error('Error loading giveaway details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await commentService.getGiveawayComments(initialGiveaway.id);
      if (data) {
        setComments(data);
      } else if (error) {
        console.error('Error loading comments:', error);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadCreatorSocialMedia = async () => {
    try {
      const { data, error } = await socialMediaService.getCreatorSocialAccounts(giveaway.creatorId);
      if (data) {
        setCreatorSocial(data);
        buildSocialRequirements(data);
      } else if (error) {
        console.error('Error loading creator social media:', error);
      }
    } catch (error) {
      console.error('Error loading creator social media:', error);
    }
  };

  const buildSocialRequirements = (socialAccounts) => {
    const requirements = [];
    
    if (socialAccounts.instagram) {
      requirements.push({ platform: 'Instagram', handle: socialAccounts.instagram, completed: false, entries: 5 });
    }
    if (socialAccounts.youtube) {
      requirements.push({ platform: 'YouTube', handle: socialAccounts.youtube, completed: true, entries: 10 });
    }
    if (socialAccounts.twitter) {
      requirements.push({ platform: 'Twitter', handle: socialAccounts.twitter, completed: false, entries: 3 });
    }
    if (socialAccounts.tiktok) {
      requirements.push({ platform: 'TikTok', handle: socialAccounts.tiktok, completed: false, entries: 4 });
    }
    if (socialAccounts.discord) {
      requirements.push({ platform: 'Discord', handle: socialAccounts.discord, completed: false, entries: 6 });
    }
    if (socialAccounts.steam) {
      requirements.push({ platform: 'Steam', handle: socialAccounts.steam, completed: false, entries: 5 });
    }
    if (socialAccounts.reddit) {
      requirements.push({ platform: 'Reddit', handle: socialAccounts.reddit, completed: false, entries: 4 });
    }
    
    setSocialRequirements(requirements);
  };

  const handleBuyTickets = () => {
    // Ensure the giveaway object has remainingTickets property
    const giveawayWithRemainingTickets = {
      ...giveaway,
      remainingTickets: giveaway.remainingTickets || (giveaway.maxEntries - giveaway.entries) || 0
    };
    navigation.navigate('TicketPurchase', { giveaway: giveawayWithRemainingTickets });
  };

  const handleSocialAction = (requirement) => {
    if (requirement.completed) {
      Alert.alert('Already Completed', 'You have already completed this requirement.');
      return;
    }

    Alert.alert(
      `Follow ${requirement.platform}`,
      `Follow ${requirement.handle} to get ${requirement.entries} extra entries!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open App', onPress: () => openSocialApp(requirement.platform) },
        { text: 'I Followed', onPress: () => verifySocialFollow(requirement) },
      ]
    );
  };

  const openSocialApp = (platform) => {
    // Here you would open the respective social media app
    console.log(`Opening ${platform} app`);
  };

  const verifySocialFollow = async (requirement) => {
    try {
      const { data, error } = await socialMediaService.verifySocialFollow(
        user?.id,
        requirement.platform,
        requirement.handle
      );
      
      if (data?.verified) {
        Alert.alert(
          'Verification Successful', 
          `Your ${requirement.platform} follow has been verified! ${requirement.entries} extra entries have been added to your account.`
        );
        // Update the requirement to show as completed
        setSocialRequirements(prev => 
          prev.map(req => 
            req.platform === requirement.platform 
              ? { ...req, completed: true }
              : req
          )
        );
      } else {
        Alert.alert(
          'Verification Pending', 
          'We will verify your follow within 24 hours. Extra entries will be added to your account once verified.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Verification Error', 
        'There was an issue verifying your follow. Please try again later.'
      );
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing giveaway: ${giveaway.title}! Win: ${giveaway.prize}`,
        title: giveaway.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCreatorPress = () => {
    // Navigate to user profile screen
    navigation.navigate('UserProfile', {
      userId: giveaway.creatorId || Math.floor(Math.random() * 1000) + 100, // Fallback random ID
      userName: giveaway.creator
    });
  };

  // Enhanced auto-moderation system
  const moderateContent = (text) => {
    const cleanText = text.toLowerCase().trim();
    
    // Comprehensive bad words list
    const profanity = [
      'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap', 'piss',
      'dickhead', 'moron', 'idiot', 'stupid', 'dumb', 'retard', 'loser'
    ];
    
    // Scam/spam keywords
    const scamWords = [
      'scam', 'fake', 'fraud', 'rigged', 'cheat', 'steal', 'money back',
      'refund', 'lawsuit', 'sue', 'lawyer', 'police', 'report'
    ];
    
    // Inappropriate promotional content
    const spamWords = [
      'check my profile', 'follow me', 'dm me', 'my link', 'visit my',
      'buy from me', 'selling', 'cheap', 'discount', 'promo code'
    ];
    
    // Hate speech indicators
    const hateWords = [
      'hate', 'kill', 'die', 'murder', 'suicide', 'kys', 'racist',
      'nazi', 'terrorist', 'bomb', 'attack'
    ];
    
    // Check for repeated characters (like "sooooo good" which might be spam)
    const hasExcessiveRepeats = /(.)\1{4,}/.test(cleanText);
    
    // Check for excessive caps
    const capsPercentage = (text.match(/[A-Z]/g) || []).length / text.length;
    const hasExcessiveCaps = capsPercentage > 0.7 && text.length > 10;
    
    // Check for excessive emojis
    const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    const hasExcessiveEmojis = emojiCount > text.length * 0.3;
    
    // URL detection
    const hasUrls = /https?:\/\/|www\.|\.com|\.net|\.org/i.test(text);
    
    // Check all categories
    const hasProfanity = profanity.some(word => cleanText.includes(word));
    const hasScamContent = scamWords.some(word => cleanText.includes(word));
    const hasSpamContent = spamWords.some(word => cleanText.includes(word));
    const hasHateSpeech = hateWords.some(word => cleanText.includes(word));
    
    return {
      isAllowed: !hasProfanity && !hasScamContent && !hasSpamContent && !hasHateSpeech && 
                 !hasExcessiveRepeats && !hasExcessiveCaps && !hasExcessiveEmojis && !hasUrls,
      reasons: {
        profanity: hasProfanity,
        scam: hasScamContent,
        spam: hasSpamContent,
        hate: hasHateSpeech,
        repeats: hasExcessiveRepeats,
        caps: hasExcessiveCaps,
        emojis: hasExcessiveEmojis,
        urls: hasUrls
      }
    };
  };

  const getBlockedMessage = (reasons) => {
    if (reasons.profanity) return 'Your comment contains inappropriate language. Please keep comments respectful.';
    if (reasons.hate) return 'Hate speech is not allowed. Please keep comments positive and constructive.';
    if (reasons.scam) return 'Comments about scams or fraud are not permitted. Contact support if you have concerns.';
    if (reasons.spam) return 'Promotional content is not allowed in comments.';
    if (reasons.urls) return 'Links are not permitted in comments for security reasons.';
    if (reasons.caps) return 'Please avoid using excessive capital letters.';
    if (reasons.emojis) return 'Please use emojis moderately in your comments.';
    if (reasons.repeats) return 'Please avoid repeating characters excessively.';
    return 'Your comment was blocked by our content filter. Please revise and try again.';
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    // Run auto-moderation
    const moderation = moderateContent(newComment);
    
    if (!moderation.isAllowed) {
      Alert.alert(
        'Comment Blocked',
        getBlockedMessage(moderation.reasons),
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSubmittingComment(true);
    
    // Check if user is shadow banned
    if (shadowBannedUsers.has(user?.id)) {
      // For shadow banned users, pretend the comment was posted but don't actually show it to others
      Alert.alert('Success', 'Your comment has been posted!');
      setNewComment('');
      setIsSubmittingComment(false);
      return;
    }
    
    try {
      // Use the real comment service
      const { data, error } = await commentService.createComment(
        giveaway.id,
        user?.id,
        newComment.trim()
      );
      
      if (data) {
        setComments(prev => [data, ...prev]);
        setNewComment('');
      } else if (error) {
        Alert.alert('Error', 'Failed to post comment. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReplyToComment = (commentId, replyText) => {
    // This would be called from a reply interface
    const reply = {
      id: Date.now(),
      user: {
        id: user?.id || 1,
        name: user?.name || 'You',
        avatar: user?.avatar || null,
        isCreator: user?.isCreator || false,
        isVerified: user?.isVerified || false,
        trustTier: user?.trustTier || 'bronze'
      },
      text: replyText,
      timestamp: 'Just now',
      isCreatorReply: user?.isCreator || false
    };

    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, replies: [...comment.replies, reply] }
        : comment
    ));
  };

  const handleReportComment = (commentId, userId) => {
    Alert.alert(
      'Report Comment',
      'Why are you reporting this comment?',
      [
        { text: 'Spam', onPress: () => reportComment(commentId, userId, 'spam') },
        { text: 'Inappropriate Language', onPress: () => reportComment(commentId, userId, 'inappropriate') },
        { text: 'Harassment', onPress: () => reportComment(commentId, userId, 'harassment') },
        { text: 'Scam/Fraud', onPress: () => reportComment(commentId, userId, 'scam') },
        { text: 'Hate Speech', onPress: () => reportComment(commentId, userId, 'hate') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const reportComment = (commentId, userId, reason) => {
    // Track reported users
    setReportedUsers(prev => new Set([...prev, userId]));
    
    // Auto shadow ban users with multiple reports (in real app, this would be server-side)
    if (reportedUsers.has(userId)) {
      setShadowBannedUsers(prev => new Set([...prev, userId]));
      Alert.alert(
        'Action Taken', 
        'Thank you for reporting. The user has been restricted from commenting.'
      );
    } else {
      Alert.alert('Thank You', 'Comment has been reported to our moderation team.');
    }
    
    // In a real app, you'd also hide/remove the comment
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, isReported: true, reportReason: reason };
      }
      return {
        ...comment,
        replies: comment.replies?.map(reply => 
          reply.id === commentId 
            ? { ...reply, isReported: true, reportReason: reason }
            : reply
        ) || []
      };
    }));
  };

  const renderComment = (comment, isReply = false) => {
    // Hide reported comments from other users (but show to admins/moderators)
    if (comment.isReported && user?.id !== comment.user.id && !user?.isAdmin) {
      return (
        <View key={comment.id} style={[styles.commentItem, styles.hiddenComment]}>
          <Text style={styles.hiddenCommentText}>
            This comment has been hidden due to community reports.
          </Text>
        </View>
      );
    }

    // Filter out comments from shadow banned users for other users
    if (shadowBannedUsers.has(comment.user.id) && user?.id !== comment.user.id && !user?.isAdmin) {
      return null;
    }

    return (
      <View key={comment.id} style={[styles.commentItem, isReply && styles.replyItem]}>
        <View style={styles.commentContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { 
            userId: comment.user.id, 
            userName: comment.user.name 
          })}>
            <ProfileAvatar 
              user={comment.user}
              size={isReply ? 32 : 40}
              getTrustTierInfo={getTrustTierInfo}
              showVerificationBadge={true}
              showTrustBadge={true}
            />
          </TouchableOpacity>
          
          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <View style={styles.commentHeaderLeft}>
                <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { 
                  userId: comment.user.id, 
                  userName: comment.user.name 
                })}>
                  <Text style={styles.commentAuthor}>
                    {comment.user.name}
                  </Text>
                </TouchableOpacity>
                {(comment.isCreatorReply || comment.user.isCreator) && (
                  <View style={styles.creatorBadgeContainer}>
                    <Text style={styles.creatorBadgeText}>Creator</Text>
                  </View>
                )}
                {comment.isReported && user?.isAdmin && (
                  <View style={styles.reportedBadge}>
                    <Text style={styles.reportedBadgeText}>Reported</Text>
                  </View>
                )}
              </View>
              <View style={styles.commentMeta}>
                <Text style={styles.commentTime}>{comment.timestamp}</Text>
                {user?.id !== comment.user.id && (
                  <TouchableOpacity 
                    style={styles.reportButton}
                    onPress={() => handleReportComment(comment.id, comment.user.id)}
                  >
                    <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <Text style={[
              styles.commentText,
              comment.isReported && user?.isAdmin && styles.reportedCommentText
            ]}>
              {comment.text}
            </Text>
            
            {!isReply && user && user.id !== comment.user.id && (
              <TouchableOpacity 
                style={styles.replyButton}
                onPress={() => {
                  Alert.prompt(
                    'Reply to Comment',
                    `Reply to ${comment.user.name}:`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Reply', 
                        onPress: (text) => {
                          if (text && text.trim()) {
                            handleReplyToComment(comment.id, text.trim());
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="chatbubble-outline" size={14} color="#007AFF" />
                <Text style={styles.replyButtonText}>Reply</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const getDeliveryIcon = (deliveryMethod) => {
    if (deliveryMethod.pickupAvailable && (deliveryMethod.usShipping || deliveryMethod.internationalShipping)) {
      return 'car-outline'; // Hybrid - both pickup and shipping
    } else if (deliveryMethod.pickupAvailable) {
      return 'storefront-outline'; // Pickup only
    } else if (deliveryMethod.internationalShipping) {
      return 'globe-outline'; // Worldwide shipping
    } else if (deliveryMethod.usShipping) {
      return 'location-outline'; // US only shipping
    }
    return 'cube-outline'; // Default
  };

  const getDeliveryTitle = (deliveryMethod) => {
    if (deliveryMethod.pickupAvailable && (deliveryMethod.usShipping || deliveryMethod.internationalShipping)) {
      return 'Delivery Available';
    } else if (deliveryMethod.pickupAvailable) {
      return 'Pickup Only';
    } else if (deliveryMethod.internationalShipping) {
      return 'Worldwide Shipping';
    } else if (deliveryMethod.usShipping) {
      return 'US Shipping Only';
    }
    return 'Delivery Available';
  };

  const renderDeliverySection = () => {
    // Always show the delivery section with proper defaults
    const delivery = deliveryMethod || {};
    
    // If no specific delivery data, show default shipping
    const hasShipping = delivery.usShipping || delivery.internationalShipping || (!delivery.pickupAvailable && Object.keys(delivery).length === 0);
    const hasPickup = delivery.pickupAvailable;
    
    return (
      <View style={styles.deliverySection}>
        <View style={styles.deliveryHeader}>
          <Ionicons name={getDeliveryIcon(delivery)} size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Delivery Options</Text>
        </View>
        
        <View style={styles.deliveryOptions}>
          {/* Shipping Options */}
          {hasShipping && (
            <View style={styles.deliveryCategory}>
              <View style={styles.deliveryOption}>
                <Ionicons name="airplane-outline" size={16} color="#007AFF" />
                <Text style={styles.deliveryOptionText}>Shipping Available</Text>
              </View>
              
              <View style={styles.deliverySubOptions}>
                {(delivery.usShipping || (!delivery.internationalShipping && hasShipping)) && (
                  <View style={styles.deliverySubOption}>
                    <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                    <Text style={styles.deliverySubOptionText}>United States</Text>
                  </View>
                )}
                {delivery.internationalShipping && (
                  <View style={styles.deliverySubOption}>
                    <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                    <Text style={styles.deliverySubOptionText}>Worldwide</Text>
                  </View>
                )}
                {(!delivery.usShipping && !delivery.internationalShipping && hasShipping) && (
                  <View style={styles.deliverySubOption}>
                    <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                    <Text style={styles.deliverySubOptionText}>Details provided to winner</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* Pickup Options */}
          {hasPickup && (
            <View style={styles.deliveryCategory}>
              <View style={styles.deliveryOption}>
                <Ionicons name="storefront-outline" size={16} color="#007AFF" />
                <Text style={styles.deliveryOptionText}>Local Pickup Available</Text>
              </View>
              
              {delivery.pickupLocations?.length > 0 && (
                <View style={styles.pickupLocations}>
                  {delivery.pickupLocations.map((location, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.pickupLocation}
                      onPress={() => handleViewLocation(location)}
                    >
                      <Ionicons name="location" size={14} color="#007AFF" />
                      <View style={styles.pickupLocationInfo}>
                        <Text style={styles.pickupLocationName}>{location.name}</Text>
                        <Text style={styles.pickupLocationAddress}>{location.address}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#666" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
        
        {delivery.shippingNotes && (
          <View style={styles.deliveryNotes}>
            <Text style={styles.deliveryNotesText}>{delivery.shippingNotes}</Text>
          </View>
        )}
        
        {delivery.estimatedDelivery && (
          <View style={styles.estimatedDelivery}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.estimatedDeliveryText}>
              Estimated delivery: {delivery.estimatedDelivery}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const handleViewLocation = (location) => {
    Alert.alert(
      location.name,
      `${location.address}\n\n${location.hours ? `Hours: ${location.hours}\n` : ''}${location.notes ? `Notes: ${location.notes}` : ''}`,
      [
        { text: 'Get Directions', onPress: () => openDirections(location) },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  const openDirections = (location) => {
    // In a real app, this would open maps with directions
    console.log(`Opening directions to ${location.name}`);
  };

  const renderCommentsSection = () => (
    <View style={styles.commentsSection}>
      <TouchableOpacity 
        style={styles.commentsHeader}
        onPress={() => setShowComments(!showComments)}
      >
        <View style={styles.commentsHeaderLeft}>
          <Ionicons name="chatbubbles" size={20} color="#007AFF" />
          <Text style={styles.commentsTitle}>
            Comments ({comments.length})
          </Text>
        </View>
        <Ionicons 
          name={showComments ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#666" 
        />
      </TouchableOpacity>
      
      {showComments && (
        <View style={styles.commentsContent}>
          {user && (
            <View style={styles.commentInput}>
              <ProfileAvatar 
                user={user}
                size={36}
                getTrustTierInfo={getTrustTierInfo}
                showVerificationBadge={true}
                showTrustBadge={true}
              />
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ask a question or leave a comment..."
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={500}
                  placeholderTextColor="#999"
                />
                <View style={styles.inputFooter}>
                  <Text style={styles.characterCount}>
                    {newComment.length}/500
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (!newComment.trim() || isSubmittingComment) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmittingComment}
                  >
                    <Ionicons 
                      name={isSubmittingComment ? "hourglass" : "send"} 
                      size={16} 
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          
          {comments.length > 0 ? (
            <View style={styles.commentsList}>
              {comments.map(comment => (
                <View key={comment.id} style={styles.commentWrapper}>
                  {renderComment(comment)}
                  {comment.replies && comment.replies.length > 0 && (
                    <View style={styles.repliesContainer}>
                      {comment.replies.map(reply => (
                        <View key={reply.id} style={styles.replyWrapper}>
                          {renderComment(reply, true)}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noComments}>
              <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
              <Text style={styles.noCommentsText}>No comments yet</Text>
              <Text style={styles.noCommentsSubtext}>
                Be the first to ask a question or leave a comment
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const daysLeft = giveaway.endDate ? 
    Math.max(0, Math.ceil((new Date(giveaway.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 
    0;
  
  // Use live data if available, fallback to original giveaway data
  const currentSoldTickets = liveData.soldTickets || giveaway.soldTickets || 0;
  const totalTickets = giveaway.totalTickets || giveaway.maxEntries || 0;
  const progressPercentage = totalTickets > 0 ? (currentSoldTickets / totalTickets) * 100 : 0;

  // Format end date safely
  const formatEndDate = (endDate) => {
    if (!endDate) return 'Date TBD';
    
    const date = new Date(endDate);
    if (isNaN(date.getTime())) return 'Date TBD';
    
    const now = new Date();
    if (date < now) return 'Ended';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Image source={giveaway.image} style={styles.headerImage} />
      
      {/* Real-time status indicator */}
      {isSubscribed && (
        <View style={[styles.liveIndicator, { top: insets.top + 10 }]}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live Updates</Text>
        </View>
      )}
      
      <View style={[styles.content, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>{giveaway.title}</Text>
            {giveaway.verified && (
              <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            )}
          </View>
          <TouchableOpacity onPress={handleCreatorPress}>
            <Text style={[styles.creator, { color: theme.primary }]}>by {giveaway.creator}</Text>
          </TouchableOpacity>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={theme.primary} />
              <Text style={[styles.shareText, { color: theme.primary }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.prizeSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Prize</Text>
          <Text style={[styles.prizeDescription, { color: theme.textSecondary }]}>
            {giveaway.prize || giveaway.description || 'Prize details will be updated soon'}
          </Text>
        </View>

        {/* Live Stats Bar */}
        <LiveStatsBar 
          soldTickets={currentSoldTickets}
          totalTickets={totalTickets}
          change={currentSoldTickets - (giveaway.soldTickets || 0)}
        />

        <View style={[styles.statsSection, { backgroundColor: theme.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>${giveaway.ticketPrice}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Per Ticket</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>{currentSoldTickets}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tickets Sold</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {daysLeft === 0 ? 'Ended' : daysLeft}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Days Left</Text>
          </View>
        </View>

        {/* Buy Entries Button - Moved up for better conversion */}
        <View style={styles.buyButtonContainer}>
          <TouchableOpacity style={[styles.buyButton, { backgroundColor: theme.primary }]} onPress={handleBuyTickets}>
            <Ionicons name="ticket" size={20} color="#fff" />
            <Text style={styles.buyButtonText}>Buy Entries</Text>
          </TouchableOpacity>
        </View>

        {/* AMOE (Alternative Method of Entry) Button */}
        <View style={styles.amoeButtonContainer}>
          <TouchableOpacity style={[styles.amoeButton, { backgroundColor: theme.surface, borderColor: theme.primary }]} onPress={() => setShowAMOEForm(true)}>
            <Ionicons name="gift-outline" size={20} color={theme.primary} />
            <Text style={[styles.amoeButtonText, { color: theme.primary }]}>Free Entry Available</Text>
          </TouchableOpacity>
          <Text style={[styles.noNpurchaseText, { color: theme.textSecondary }]}>
            No Purchase Necessary •{' '}
            <Text 
              style={[styles.rulesLink, { color: theme.primary }]}
              onPress={() => setShowOfficialRules(true)}
            >
              Official Rules
            </Text>
            {' • '}
            <Text 
              style={[styles.rulesLink, { color: theme.primary }]}
              onPress={() => setShowHowItWorks(true)}
            >
              How it works
            </Text>
            {' • '}
            <Text 
              style={[styles.rulesLink, { color: theme.primary }]}
              onPress={() => setShowAMOEForm(true)}
            >
              AMOE
            </Text>
          </Text>
        </View>

        {/* Live Activity Toggle */}
        <TouchableOpacity 
          style={[styles.liveActivityToggle, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => setShowLiveActivity(!showLiveActivity)}
        >
          <View style={styles.liveActivityHeader}>
            <Ionicons name="pulse" size={16} color="#4CAF50" />
            <Text style={[styles.liveActivityText, { color: theme.text }]}>Recent Activity</Text>
            <View style={[styles.entryCount, { backgroundColor: theme.primary }]}>
              <Text style={styles.entryCountText}>{liveData.recentEntries.length}</Text>
            </View>
          </View>
          <Ionicons 
            name={showLiveActivity ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={theme.textSecondary} 
          />
        </TouchableOpacity>

        {/* Live Activity Feed */}
        <LiveActivityFeed 
          recentEntries={liveData.recentEntries}
          isVisible={showLiveActivity}
          onToggle={() => setShowLiveActivity(false)}
        />

        <View style={[styles.progressSection, { backgroundColor: theme.surface }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressText, { color: theme.text }]}>Progress</Text>
            <Text style={[styles.progressPercentage, { color: theme.primary }]}>{progressPercentage.toFixed(1)}%</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View style={[styles.progressFill, { width: `${Math.min(progressPercentage, 100)}%`, backgroundColor: theme.primary }]} />
          </View>
          <Text style={[styles.progressDetails, { color: theme.textSecondary }]}>
            {currentSoldTickets} of {totalTickets} tickets sold
          </Text>
        </View>

        {userTickets > 0 && (
          <View style={[styles.userTicketsSection, { backgroundColor: theme.surface }]}>
            <View style={styles.userTicketsHeader}>
              <Ionicons name="ticket" size={24} color={theme.primary} />
              <Text style={styles.userTicketsText}>
                You have {userTickets} {userTickets === 1 ? 'ticket' : 'tickets'}
              </Text>
            </View>
          </View>
        )}

        {socialRequirements.length > 0 && (
          <View style={styles.socialSection}>
            <Text style={styles.sectionTitle}>Get Extra Entries</Text>
            <Text style={styles.socialDescription}>
              Follow the creator on social media to get bonus entries!
            </Text>
            
            {socialRequirements.map((requirement, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.socialItem,
                requirement.completed && styles.socialItemCompleted,
              ]}
              onPress={() => handleSocialAction(requirement)}
            >
              <View style={styles.socialInfo}>
                <Text style={styles.socialPlatform}>{requirement.platform}</Text>
                <Text style={styles.socialHandle}>{requirement.handle}</Text>
              </View>
              <View style={styles.socialRight}>
                <Text style={styles.socialEntries}>+{requirement.entries} entries</Text>
                {requirement.completed ? (
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                )}
              </View>
            </TouchableOpacity>
          ))}
          </View>
        )}

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {giveaway.description || 
            `Join this amazing giveaway for a chance to win ${giveaway.prize}! 
            
This giveaway is hosted by ${giveaway.creator}, a verified creator on our platform. 
            
Rules:
• Must be 18+ to participate
• Winner will be selected randomly
• Winner will be announced within 48 hours of giveaway end
• Prize will be shipped within 7-14 business days
• International shipping available

Good luck to everyone participating!`}
          </Text>
        </View>

        {renderDeliverySection()}

        <View style={styles.endDateSection}>
          <Ionicons name="time" size={20} color="#666" />
          <Text style={styles.endDateText}>
            {formatEndDate(giveaway.endDate)}
          </Text>
        </View>

        {renderCommentsSection()}
      </View>

      {/* AMOE Modal */}
      <AMOEForm
        visible={showAMOEForm}
        onClose={() => setShowAMOEForm(false)}
        giveawayId={giveaway.id}
        giveawayTitle={giveaway.title}
      />

      {/* Official Rules Modal */}
      <OfficialRules
        visible={showOfficialRules}
        onClose={() => setShowOfficialRules(false)}
        giveaway={giveaway}
        sponsor={{
          name: giveaway?.creator?.name || giveaway?.sponsor || "Entry Point",
          address: "123 Main Street, Anytown, State 12345" // This should come from giveaway data
        }}
      />

      {/* Fairness Proof Modal */}
      <FairnessProofModal
        visible={showFairnessProof}
        onClose={() => setShowFairnessProof(false)}
        giveawayId={giveaway.id}
      />

      {/* How It Works Modal */}
      <HowItWorksModal
        visible={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
        onOpenOfficialRules={() => {
          setShowHowItWorks(false);
          setShowOfficialRules(true);
        }}
        onOpenAMOE={() => {
          setShowHowItWorks(false);
          setShowAMOEForm(true);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  creator: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
  },
  shareText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  prizeSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  prizeDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  progressSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  progressDetails: {
    fontSize: 14,
    color: '#666',
  },
  userTicketsSection: {
    backgroundColor: '#e8f4fd',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  userTicketsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTicketsText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  socialSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
  },
  socialDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  socialItemCompleted: {
    opacity: 0.6,
  },
  socialInfo: {
    flex: 1,
  },
  socialPlatform: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  socialHandle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  socialRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialEntries: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
    marginRight: 8,
  },
  descriptionSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  endDateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  endDateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  // Delivery Method Styles
  deliverySection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  deliveryOptions: {
    marginBottom: 15,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryOptionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  pickupSection: {
    marginTop: 10,
  },
  pickupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
    marginTop: 8,
  },
  pickupLocations: {
    marginLeft: 24,
  },
  pickupLocation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  pickupLocationInfo: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  pickupLocationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  pickupLocationAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  pickupLocationHours: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 2,
  },
  pickupLocationNotes: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  deliveryNotes: {
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  deliveryNotesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  deliveryCategory: {
    marginBottom: 15,
  },
  deliverySubOptions: {
    marginLeft: 24,
    marginTop: 8,
  },
  deliverySubOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  deliverySubOptionText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  estimatedDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estimatedDeliveryText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  buyButtonContainer: {
    marginVertical: 20,
    paddingHorizontal: 0,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // AMOE Button Styles
  amoeButtonContainer: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  amoeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  amoeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  noNpurchaseText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  rulesLink: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  // Comment System Styles
  commentsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1a1a1a',
  },
  commentsContent: {
    backgroundColor: '#fff',
  },
  commentInput: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'flex-start',
  },
  inputContainer: {
    flex: 1,
    marginLeft: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#f8f9fa',
    minHeight: 44,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  submitButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  commentsList: {
    backgroundColor: '#fff',
  },
  commentWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  commentItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  creatorBadgeContainer: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  creatorBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentTime: {
    fontSize: 13,
    color: '#999',
    marginRight: 8,
  },
  reportButton: {
    padding: 4,
    borderRadius: 12,
  },
  commentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  replyButtonText: {
    fontSize: 13,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  repliesContainer: {
    backgroundColor: '#fafafa',
    marginLeft: 15,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
  },
  replyWrapper: {
    backgroundColor: '#fafafa',
  },
  replyItem: {
    paddingLeft: 15,
    backgroundColor: '#fafafa',
  },
  noComments: {
    padding: 40,
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Moderation Styles
  hiddenComment: {
    backgroundColor: '#f8f8f8',
    opacity: 0.6,
    paddingVertical: 15,
  },
  hiddenCommentText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  reportedBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  reportedBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  reportedCommentText: {
    backgroundColor: '#fff2f2',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  // Live Components Styles
  liveIndicator: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 6,
  },
  liveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  liveActivityToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  liveActivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveActivityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  entryCount: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  entryCountText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
});
