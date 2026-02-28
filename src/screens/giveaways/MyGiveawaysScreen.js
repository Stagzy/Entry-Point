/**
 * MyGiveawaysScreen.js
 * 
 * PURPOSE:
 * Comprehensive giveaway management dashboard providing dual-interface portfolio view
 * for users to manage their created giveaways and track their participation history.
 * Serves as the central hub for creator analytics and participant investment tracking.
 * 
 * NAVIGATION FLOW:
 * Accessible from: Profile screen, main navigation drawer, HomeScreen quick actions
 * Navigates to: GiveawayDetail (view specifics), CreateGiveawayScreen (new creation),
 * creator analytics workflows, payment tracking systems
 * 
 * KEY FEATURES:
 * • Dual-Tab Interface: "Created" vs "Entered" giveaways with separate data views
 * • Creator Dashboard: Revenue tracking, performance analytics, progress monitoring
 * • Participant Portfolio: Entry history, win/loss tracking, investment analysis
 * • Real-time Statistics: Live counts, revenue totals, success rates, performance metrics
 * • Advanced Management: Edit, delete, analytics for created giveaways
 * • Progress Visualization: Dynamic progress bars with color-coded completion status
 * • Interactive Analytics: Quick stats overview, detailed performance insights
 * • Status Management: Active/completed/pending/cancelled state tracking
 * • Empty State Handling: Contextual prompts for creation vs participation
 * 
 * USER REQUIREMENTS:
 * • Authenticated user (both creators and participants)
 * • No specific trust tier requirements for viewing
 * • Creator status enables advanced management features
 * • Verified users see enhanced analytics capabilities
 * 
 * STATE MANAGEMENT:
 * • Tab switching between created/entered views
 * • Real-time data refresh with pull-to-refresh
 * • Dynamic progress calculations and color coding
 * • Revenue and analytics aggregation
 * • Modal confirmations for destructive actions
 * 
 * TECHNICAL DETAILS:
 * • FlatList with optimized rendering for large datasets
 * • Mock data integration ready for API replacement
 * • Progress bar animations with percentage-based color coding
 * • Alert system for confirmations and analytics display
 * • Responsive card layout with contextual action buttons
 * • Statistics aggregation with real-time calculations
 * 
 * RELATED SCREENS:
 * • GiveawayDetailScreen: Individual giveaway management
 * • CreateGiveawayScreen: New giveaway creation
 * • CreatorAnalyticsScreen: Detailed performance analytics
 * • ProfileScreen: User dashboard and navigation hub
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
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { giveawayService } from '../../services/api';

export default function MyGiveawaysScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('ongoing');
  const [refreshing, setRefreshing] = useState(false);
  const [createdGiveaways, setCreatedGiveaways] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      
      if (!user?.id) {
        console.log('No user found, skipping giveaway data load');
        return;
      }
      
      // Load creator's giveaways from database
      const { data: createdGiveaways, error: createdError } = await giveawayService.getCreatorGiveaways(user.id);
      
      if (createdError) {
        console.error('Error loading created giveaways:', createdError);
      }
      
      // Set the data regardless of error (empty array if error)
      setCreatedGiveaways(createdGiveaways || []);
      
    } catch (error) {
      console.error('Error loading giveaway data:', error);
      // Set empty data and continue silently
      setCreatedGiveaways([]);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
      return `Ends ${formatDate(endDate)}`;
    }
  };

  const handleEditGiveaway = (giveaway) => {
    Alert.alert(
      'Edit Giveaway',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Details', onPress: () => navigation.navigate('GiveawayDetail', { giveaway }) },
        { text: 'Edit Settings', onPress: () => Alert.alert('Coming Soon', 'Edit functionality coming soon!') },
        { text: 'View Analytics', onPress: () => showAnalytics(giveaway) },
      ]
    );
  };

  const handleDeleteGiveaway = (giveaway) => {
    Alert.alert(
      'Delete Giveaway',
      'Are you sure you want to delete this giveaway? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            setCreatedGiveaways(prev => prev.filter(g => g.id !== giveaway.id));
            Alert.alert('Deleted', 'Giveaway has been deleted successfully.');
          }
        },
      ]
    );
  };

  const showAnalytics = (giveaway) => {
    Alert.alert(
      'Giveaway Analytics',
      `Views: ${giveaway.views?.toLocaleString() || 'N/A'}\nFavorites: ${giveaway.favorites || 'N/A'}\nRevenue: $${giveaway.revenue?.toLocaleString() || 'N/A'}\nProgress: ${((giveaway.soldTickets / giveaway.totalTickets) * 100).toFixed(1)}%`
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#34C759';
      case 'completed': return '#007AFF';
      case 'pending': return '#FF9500';
      case 'cancelled': return '#FF3B30';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const renderCreatedGiveaway = ({ item }) => {
    const progressPercentage = item.max_entries ? ((item.current_entries || 0) / item.max_entries) * 100 : 0;
    
    // Dynamic progress bar color based on percentage
    const getProgressColor = (percentage) => {
      if (percentage < 50) return '#4CAF50'; // Green
      if (percentage < 80) return '#FF9800'; // Yellow/Orange
      return '#F44336'; // Red
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

    const revenue = (item.entry_cost || 0) * (item.current_entries || 0);

    return (
      <TouchableOpacity 
        style={[styles.giveawayCard, { backgroundColor: theme.surface }]}
        onPress={() => handleEditGiveaway(item)}
      >
        {/* Image Section with Status Badge */}
        <View style={[styles.imageSection, { backgroundColor: theme.background }]}>
          <View style={[styles.emojiContainer, { backgroundColor: getStatusColor(item.status) }]}>
            <Ionicons name={getStatusIcon(item.status)} size={24} color="white" />
          </View>
          <Text style={[styles.categoryLabel, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
          
          {/* Action Buttons in top right */}
          <View style={styles.topRightActions}>
            <TouchableOpacity 
              style={[styles.topActionButton, { backgroundColor: theme.surface }]}
              onPress={() => handleEditGiveaway(item)}
            >
              <Ionicons name="settings-outline" size={16} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.topActionButton, { backgroundColor: theme.surface }]}
              onPress={() => handleDeleteGiveaway(item)}
            >
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Content Section */}
        <View style={styles.contentSection}>
          <Text style={[styles.giveawayTitle, { color: theme.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          
          <Text style={[styles.giveawayDescription, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.prize}
          </Text>
          
          {/* Progress Bar */}
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
              {item.current_entries || 0} / {item.max_entries || 0} entries
            </Text>
          </View>
          
          {/* Bottom Section with Revenue, Saves, and End Date */}
          <View style={styles.bottomSection}>
            <Text style={styles.costPerEntry}>
              ${revenue.toLocaleString()} revenue
            </Text>
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={14} color="#FF3B30" />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.favorites || 0}</Text>
            </View>
            <Text style={[styles.timeLeft, { color: theme.textSecondary }]}>
              {formatTimeRemaining(item.end_date)}
            </Text>
          </View>

          {item.winner && (
            <View style={styles.winnerInfo}>
              <Ionicons name="trophy" size={14} color="#FFD700" />
              <Text style={styles.winnerText}>Winner: {item.winner}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabButton = (tab, label, count) => (
    <TouchableOpacity
      style={[
        styles.tabButton, 
        { backgroundColor: theme.surface },
        activeTab === tab && styles.activeTabButton
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[
        styles.tabText, 
        { color: theme.text },
        activeTab === tab && styles.activeTabText
      ]}>
        {label}
      </Text>
      <View style={[
        styles.tabCount, 
        { backgroundColor: theme.background },
        activeTab === tab && styles.activeTabCount
      ]}>
        <Text style={[
          styles.tabCountText, 
          { color: theme.text },
          activeTab === tab && styles.activeTabCountText
        ]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={activeTab === 'ongoing' ? 'play-circle-outline' : 'checkmark-circle-outline'} 
        size={64} 
        color={theme.textSecondary} 
      />
      <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
        {activeTab === 'ongoing' ? 'No Ongoing Giveaways' : 'No Completed Giveaways'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {activeTab === 'ongoing' 
          ? 'Start creating your first giveaway to engage with your audience'
          : 'Your completed giveaways will appear here once they finish'
        }
      </Text>
      {activeTab === 'ongoing' && (
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={() => navigation.navigate('CreateGiveawayWizard')}
        >
          <Text style={styles.emptyButtonText}>
            Create Giveaway
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent={false}
      />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Giveaways</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Stats Overview */}
      <View style={[styles.statsContainer, { backgroundColor: theme.background }]}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.text }]}>{createdGiveaways.length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.text }]}>${createdGiveaways.reduce((sum, g) => sum + ((g.entry_cost || 0) * (g.current_entries || 0)), 0).toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.text }]}>{createdGiveaways.filter(g => g.status === 'active').length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Ongoing</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.text }]}>{createdGiveaways.filter(g => g.status === 'completed').length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completed</Text>
        </View>
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === 'ongoing' ? createdGiveaways.filter(g => g.status === 'active' || g.status === 'draft') : createdGiveaways.filter(g => g.status === 'completed' || g.status === 'cancelled')}
        keyExtractor={(item) => (item.id || 0).toString()}
        renderItem={renderCreatedGiveaway}
        style={styles.giveawaysList}
        contentContainerStyle={[
          styles.giveawaysContent,
          (activeTab === 'ongoing' ? createdGiveaways.filter(g => g.status === 'active' || g.status === 'draft') : createdGiveaways.filter(g => g.status === 'completed' || g.status === 'cancelled')).length === 0 && styles.emptyContentContainer
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={() => (
          <View style={[styles.tabContainer, { backgroundColor: theme.background }]}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContent}
            >
              {renderTabButton('ongoing', 'Ongoing', createdGiveaways.filter(g => g.status === 'active' || g.status === 'draft').length)}
              {renderTabButton('completed', 'Completed', createdGiveaways.filter(g => g.status === 'completed' || g.status === 'cancelled').length)}
            </ScrollView>
          </View>
        )}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10, // Reduced from 15 for more compact design
    marginBottom: 5, // Reduced from 10
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tabsContent: {
    paddingRight: 20,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeTabButton: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  activeTabText: {
    color: '#fff',
  },
  tabCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeTabCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  activeTabCountText: {
    color: '#fff',
  },
  giveawaysList: {
    flex: 1,
  },
  giveawaysContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  giveawayCard: {
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
  topRightActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  topActionButton: {
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentSection: {
    padding: 12,
  },
  giveawayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  creatorName: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 6,
  },
  giveawayDescription: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 18,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
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
    color: '#4CAF50',
    flex: 1,
  },
  timeLeft: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
  endDateSmall: {
    fontSize: 11,
    fontWeight: '500',
  },
  winnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    padding: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  winnerText: {
    fontSize: 11,
    color: '#b8860b',
    marginLeft: 4,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
    paddingHorizontal: 40,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
