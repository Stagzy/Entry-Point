import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

export default function CreatorAnalyticsScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [creatorStats, setCreatorStats] = useState({
    totalRevenue: 0,
    totalGiveaways: 0,
    activeGiveaways: 0,
    completedGiveaways: 0,
    totalTicketsSold: 0,
    totalParticipants: 0,
    averageTicketPrice: 0,
    revenueBreakdown: [],
    topGiveaways: [],
  });

  const periods = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
    { id: 'all', label: 'All Time' },
  ];

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      if (user?.is_verified) {
        console.log('📊 Loading creator analytics for:', user.id);
        const { data, error } = await api.analytics.getCreatorAnalytics(user.id, selectedPeriod);
        
        if (error) {
          console.error('Failed to load creator analytics:', error);
          return;
        }

        console.log('✅ Analytics loaded:', data);
        setCreatorStats(data);
      } else {
        console.log('📊 User not verified - showing empty analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and period change
  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod, user?.id, user?.is_verified]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <StatusBar 
        barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Analytics</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Period Selector */}
      <View style={[styles.periodSelector, { backgroundColor: theme.surface }]}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.id}
            style={[
              styles.periodButton,
              selectedPeriod === period.id && [styles.selectedPeriod, { backgroundColor: theme.primary }]
            ]}
            onPress={() => setSelectedPeriod(period.id)}
          >
            <Text style={[
              styles.periodText,
              { color: theme.textSecondary },
              selectedPeriod === period.id && { color: '#fff' }
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading analytics...
          </Text>
        </View>
      )}

      {/* Content */}
      {!loading && (
        <View style={styles.content}>
          {/* Key Metrics */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.metricValue, { color: theme.primary }]}>
                  {formatCurrency(creatorStats.totalRevenue)}
                </Text>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Revenue</Text>
              </View>
              
              <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.metricValue, { color: theme.primary }]}>
                  {creatorStats.totalGiveaways}
                </Text>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Giveaways</Text>
              </View>
              
              <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.metricValue, { color: theme.primary }]}>
                  {creatorStats.totalParticipants}
                </Text>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Participants</Text>
              </View>
              
              <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.metricValue, { color: theme.primary }]}>
                  {creatorStats.totalTicketsSold}
                </Text>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Tickets Sold</Text>
              </View>
            </View>
          </View>

          {/* Giveaway Status */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Giveaway Status</Text>
            <View style={[styles.statusCard, { backgroundColor: theme.surface }]}>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Active</Text>
                <Text style={[styles.statusValue, { color: '#4CAF50' }]}>
                  {creatorStats.activeGiveaways}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Completed</Text>
                <Text style={[styles.statusValue, { color: theme.text }]}>
                  {creatorStats.completedGiveaways}
                </Text>
              </View>
            </View>
          </View>

          {/* Top Giveaways */}
          {creatorStats.topGiveaways && creatorStats.topGiveaways.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Performing Giveaways</Text>
              {creatorStats.topGiveaways.map((giveaway, index) => (
                <View key={index} style={[styles.giveawayCard, { backgroundColor: theme.surface }]}>
                  <View style={styles.giveawayHeader}>
                    <Text style={[styles.giveawayTitle, { color: theme.text }]} numberOfLines={1}>
                      {giveaway.title}
                    </Text>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: giveaway.status === 'active' ? '#4CAF50' : '#757575' }
                    ]}>
                      <Text style={styles.statusBadgeText}>{giveaway.status}</Text>
                    </View>
                  </View>
                  <View style={styles.giveawayStats}>
                    <View style={styles.giveawayStat}>
                      <Text style={[styles.giveawayStatValue, { color: theme.primary }]}>
                        {formatCurrency(giveaway.revenue)}
                      </Text>
                      <Text style={[styles.giveawayStatLabel, { color: theme.textSecondary }]}>Revenue</Text>
                    </View>
                    <View style={styles.giveawayStat}>
                      <Text style={[styles.giveawayStatValue, { color: theme.primary }]}>
                        {giveaway.tickets}
                      </Text>
                      <Text style={[styles.giveawayStatLabel, { color: theme.textSecondary }]}>Tickets</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {creatorStats.totalGiveaways === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Analytics Yet</Text>
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                Create your first giveaway to start seeing analytics data
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
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
  periodSelector: {
    flexDirection: 'row',
    margin: 15,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedPeriod: {
    // backgroundColor set dynamically
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 16,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  giveawayCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  giveawayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  giveawayTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  giveawayStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  giveawayStat: {
    alignItems: 'center',
  },
  giveawayStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  giveawayStatLabel: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});
