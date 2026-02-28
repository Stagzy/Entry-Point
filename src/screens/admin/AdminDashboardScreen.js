import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { ToastContext } from '../../context/ToastContext';
import adminActionsService from '../../services/adminActionsService';
import supportService from '../../services/supportService';

export default function AdminDashboardScreen({ navigation }) {
  const { showToast } = useContext(ToastContext);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingGiveaways: 0,
    approvedGiveaways: 0,
    rejectedGiveaways: 0,
    totalUsers: 0,
    verifiedCreators: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
    activeGiveaways: 0,
    pendingKYC: 0,
    openDisputes: 0,
    openTickets: 0,
    recentActions: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get admin stats from our service
      const adminStats = await adminActionsService.getAdminStats();
      
      // Get existing giveaway stats
      const [giveawayStats, userStats, revenueStats] = await Promise.all([
        supabase
          .from('giveaways')
          .select('status')
          .then(({ data }) => {
            const pending = data?.filter(g => g.status === 'pending_approval').length || 0;
            const approved = data?.filter(g => g.status === 'approved' || g.status === 'active').length || 0;
            const rejected = data?.filter(g => g.status === 'rejected').length || 0;
            const active = data?.filter(g => g.status === 'active').length || 0;
            return { pending, approved, rejected, active };
          }),
        supabase
          .from('profiles')
          .select('id, is_verified')
          .then(({ data }) => {
            const total = data?.length || 0;
            const verified = data?.filter(u => u.is_verified).length || 0;
            return { total, verified };
          }),
        supabase
          .from('entries')
          .select('total_cost')
          .eq('payment_status', 'completed')
          .then(({ data }) => {
            const total = data?.reduce((sum, entry) => sum + (entry.total_cost || 0), 0) || 0;
            return total;
          })
      ]);

      setStats({
        pendingGiveaways: giveawayStats.pending,
        approvedGiveaways: giveawayStats.approved,
        rejectedGiveaways: giveawayStats.rejected,
        activeGiveaways: giveawayStats.active,
        totalUsers: userStats.total,
        verifiedCreators: userStats.verified,
        totalRevenue: revenueStats,
        pendingKYC: adminStats.pendingKYC,
        openDisputes: adminStats.openDisputes,
        openTickets: await getOpenTicketsCount(),
        recentActions: adminStats.recentActions
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getOpenTicketsCount = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('id')
        .in('status', ['open', 'pending_response', 'escalated']);
      
      return data?.length || 0;
    } catch (error) {
      return 0;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData().finally(() => setRefreshing(false));
  };

  const StatCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  const QuickAction = ({ title, subtitle, icon, color, onPress }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage giveaways and users</Text>
      </View>

      {/* Overview Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Pending Approval"
            value={stats.pendingGiveaways}
            icon="time"
            color="#FF9500"
            onPress={() => navigation.navigate('PendingGiveaways')}
          />
          <StatCard
            title="Active Giveaways"
            value={stats.activeGiveaways}
            icon="gift"
            color="#34C759"
            onPress={() => navigation.navigate('ActiveGiveaways')}
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon="people"
            color="#007AFF"
            onPress={() => navigation.navigate('ManageUsers')}
          />
          <StatCard
            title="Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon="cash"
            color="#32D74B"
            onPress={() => navigation.navigate('Analytics')}
          />
        </View>
      </View>

      {/* Support & Disputes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support & Disputes</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Open Tickets"
            value={stats.openTickets}
            icon="help-circle"
            color="#5856D6"
            onPress={() => navigation.navigate('SupportTickets')}
          />
          <StatCard
            title="Open Disputes"
            value={stats.openDisputes}
            icon="alert-circle"
            color="#FF3B30"
            onPress={() => navigation.navigate('DisputeManagement')}
          />
          <StatCard
            title="Pending KYC"
            value={stats.pendingKYC}
            icon="shield-checkmark"
            color="#FF9500"
            onPress={() => navigation.navigate('KYCVerification')}
          />
          <StatCard
            title="FAQ Management"
            value="Manage"
            icon="library"
            color="#30B0C7"
            onPress={() => navigation.navigate('FAQManagement')}
          />
        </View>
      </View>

      {/* Recent Admin Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Admin Actions</Text>
        {stats.recentActions && stats.recentActions.length > 0 ? (
          stats.recentActions.map((action, index) => (
            <View key={index} style={styles.actionItem}>
              <View style={styles.actionHeader}>
                <Text style={styles.actionTitle}>{action.action.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.actionTime}>
                  {new Date(action.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.actionTarget}>
                {action.target_type}: {action.target_id}
              </Text>
              {action.reason && (
                <Text style={styles.actionReason}>{action.reason}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent actions</Text>
        )}
      </View>

      {/* Verification Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Creator Verification</Text>
        <View style={styles.statsRow}>
          <StatCard
            title="Verified Creators"
            value={stats.verifiedCreators}
            icon="checkmark-circle"
            color="#34C759"
          />
          <StatCard
            title="Pending Verification"
            value={stats.pendingVerifications}
            icon="person-add"
            color="#FF9500"
            onPress={() => navigation.navigate('PendingVerifications')}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <QuickAction
          title="Review Pending Giveaways"
          subtitle={`${stats.pendingGiveaways} awaiting approval`}
          icon="clipboard"
          color="#FF9500"
          onPress={() => navigation.navigate('PendingGiveaways')}
        />
        <QuickAction
          title="Verify Creators"
          subtitle={`${stats.pendingVerifications} applications pending`}
          icon="person-add"
          color="#007AFF"
          onPress={() => navigation.navigate('PendingVerifications')}
        />
        <QuickAction
          title="Manage Users"
          subtitle="View and manage user accounts"
          icon="people"
          color="#34C759"
          onPress={() => navigation.navigate('ManageUsers')}
        />
        <QuickAction
          title="Analytics"
          subtitle="View detailed reports and metrics"
          icon="analytics"
          color="#8E44AD"
          onPress={() => navigation.navigate('Analytics')}
        />
        <QuickAction
          title="Settings"
          subtitle="Admin settings and configuration"
          icon="settings"
          color="#6C757D"
          onPress={() => navigation.navigate('AdminSettings')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  actionTime: {
    fontSize: 12,
    color: '#666',
  },
  actionTarget: {
    fontSize: 13,
    color: '#007AFF',
    marginBottom: 3,
  },
  actionReason: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
