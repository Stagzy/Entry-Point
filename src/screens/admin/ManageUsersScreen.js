import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ManageUsersScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, verified, flagged, banned

  // Mock users data
  const mockUsers = [
    {
      id: 1,
      username: '@techreview_pro',
      email: 'techreview@example.com',
      verified: true,
      joinDate: '2024-01-15',
      totalGiveaways: 12,
      totalTicketsSold: 15420,
      revenue: '$123,360',
      followers: '125K',
      status: 'active',
      flaggedReports: 0,
      lastActive: '2025-07-18',
      riskScore: 'Low',
    },
    {
      id: 2,
      username: '@cashgiveaways_daily',
      email: 'cash@example.com',
      verified: false,
      joinDate: '2024-06-20',
      totalGiveaways: 8,
      totalTicketsSold: 3200,
      revenue: '$48,000',
      followers: '89K',
      status: 'flagged',
      flaggedReports: 3,
      lastActive: '2025-07-17',
      riskScore: 'Medium',
    },
    {
      id: 3,
      username: '@gamingsetup_builds',
      email: 'gaming@example.com',
      verified: true,
      joinDate: '2023-11-08',
      totalGiveaways: 25,
      totalTicketsSold: 32100,
      revenue: '$384,600',
      followers: '256K',
      status: 'active',
      flaggedReports: 0,
      lastActive: '2025-07-18',
      riskScore: 'Low',
    },
    {
      id: 4,
      username: '@scammer_account',
      email: 'scam@example.com',
      verified: false,
      joinDate: '2025-07-10',
      totalGiveaways: 2,
      totalTicketsSold: 150,
      revenue: '$2,250',
      followers: '1.2K',
      status: 'banned',
      flaggedReports: 15,
      lastActive: '2025-07-15',
      riskScore: 'High',
    },
  ];

  useEffect(() => {
    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, filterType, users]);

  const filterUsers = () => {
    let filtered = users;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    switch (filterType) {
      case 'verified':
        filtered = filtered.filter(user => user.verified);
        break;
      case 'flagged':
        filtered = filtered.filter(user => user.status === 'flagged');
        break;
      case 'banned':
        filtered = filtered.filter(user => user.status === 'banned');
        break;
      default:
        break;
    }

    setFilteredUsers(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#34C759';
      case 'flagged': return '#FF9500';
      case 'banned': return '#FF3B30';
      default: return '#666';
    }
  };

  const getRiskColor = (riskScore) => {
    switch (riskScore.toLowerCase()) {
      case 'low': return '#34C759';
      case 'medium': return '#FF9500';
      case 'high': return '#FF3B30';
      default: return '#666';
    }
  };

  const verifyUser = (userId) => {
    Alert.alert(
      'Verify User',
      'Are you sure you want to verify this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify',
          style: 'default',
          onPress: () => {
            setUsers(prev => prev.map(user =>
              user.id === userId ? { ...user, verified: true } : user
            ));
            Alert.alert('Success', 'User has been verified!');
            setModalVisible(false);
          },
        },
      ]
    );
  };

  const banUser = (userId) => {
    Alert.alert(
      'Ban User',
      'Are you sure you want to ban this user? This will suspend all their giveaways.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: () => {
            setUsers(prev => prev.map(user =>
              user.id === userId ? { ...user, status: 'banned' } : user
            ));
            Alert.alert('Banned', 'User has been banned from the platform.');
            setModalVisible(false);
          },
        },
      ]
    );
  };

  const unbanUser = (userId) => {
    Alert.alert(
      'Unban User',
      'Are you sure you want to unban this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unban',
          style: 'default',
          onPress: () => {
            setUsers(prev => prev.map(user =>
              user.id === userId ? { ...user, status: 'active' } : user
            ));
            Alert.alert('Unbanned', 'User has been unbanned.');
            setModalVisible(false);
          },
        },
      ]
    );
  };

  const renderFilterButton = (type, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterType === type && styles.filterButtonActive
      ]}
      onPress={() => setFilterType(type)}
    >
      <Text style={[
        styles.filterButtonText,
        filterType === type && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderUserCard = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        setSelectedUser(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.username}>{item.username}</Text>
            {item.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            )}
          </View>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.userStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.totalGiveaways}</Text>
          <Text style={styles.statLabel}>Giveaways</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.revenue}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      {item.flaggedReports > 0 && (
        <View style={styles.flaggedWarning}>
          <Ionicons name="warning" size={16} color="#FF9500" />
          <Text style={styles.flaggedText}>
            {item.flaggedReports} report{item.flaggedReports > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const UserDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedUser && (
            <View style={styles.modalBody}>
              <View style={styles.modalUserHeader}>
                <Text style={styles.modalUsername}>{selectedUser.username}</Text>
                <View style={[styles.riskBadge, { backgroundColor: getRiskColor(selectedUser.riskScore) }]}>
                  <Text style={styles.riskBadgeText}>{selectedUser.riskScore} Risk</Text>
                </View>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Email:</Text>
                <Text style={styles.modalValue}>{selectedUser.email}</Text>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Join Date:</Text>
                <Text style={styles.modalValue}>{selectedUser.joinDate}</Text>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Total Revenue:</Text>
                <Text style={styles.modalValue}>{selectedUser.revenue}</Text>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Tickets Sold:</Text>
                <Text style={styles.modalValue}>{selectedUser.totalTicketsSold.toLocaleString()}</Text>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Flagged Reports:</Text>
                <Text style={[styles.modalValue, { color: selectedUser.flaggedReports > 0 ? '#FF9500' : '#34C759' }]}>
                  {selectedUser.flaggedReports}
                </Text>
              </View>

              <View style={styles.modalActions}>
                {!selectedUser.verified && selectedUser.status !== 'banned' && (
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.verifyButton]}
                    onPress={() => verifyUser(selectedUser.id)}
                  >
                    <Text style={styles.verifyButtonText}>Verify User</Text>
                  </TouchableOpacity>
                )}

                {selectedUser.status === 'banned' ? (
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.unbanButton]}
                    onPress={() => unbanUser(selectedUser.id)}
                  >
                    <Text style={styles.unbanButtonText}>Unban User</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.banButton]}
                    onPress={() => banUser(selectedUser.id)}
                  >
                    <Text style={styles.banButtonText}>Ban User</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Users</Text>
        <View style={styles.headerRight}>
          <Text style={styles.userCount}>{filteredUsers.length}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('verified', 'Verified')}
        {renderFilterButton('flagged', 'Flagged')}
        {renderFilterButton('banned', 'Banned')}
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.usersList}
        showsVerticalScrollIndicator={false}
      />

      <UserDetailModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  userCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1a1a1a',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  usersList: {
    padding: 15,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginRight: 8,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  flaggedWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
  },
  flaggedText: {
    fontSize: 12,
    color: '#FF9500',
    marginLeft: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalBody: {
    padding: 20,
  },
  modalUserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalUsername: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  riskBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  modalRow: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#34C759',
  },
  banButton: {
    backgroundColor: '#FF3B30',
  },
  unbanButton: {
    backgroundColor: '#007AFF',
  },
  verifyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  banButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  unbanButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
