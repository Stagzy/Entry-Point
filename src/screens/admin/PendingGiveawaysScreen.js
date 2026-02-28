import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PendingGiveawaysScreen({ navigation }) {
  const [pendingGiveaways, setPendingGiveaways] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGiveaway, setSelectedGiveaway] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Mock pending giveaways data
  const mockPendingGiveaways = [
    {
      id: 1,
      title: 'iPhone 15 Pro Max Giveaway',
      creator: '@techreview_pro',
      creatorVerified: true,
      prize: 'iPhone 15 Pro Max 1TB',
      ticketPrice: 8,
      totalTickets: 1000,
      endDate: '2025-08-15',
      category: 'tech',
      submittedDate: '2025-07-18',
      image: null,
      description: 'Brand new iPhone 15 Pro Max in Natural Titanium color. Includes original packaging and 1-year warranty.',
      requirements: 'Must be 18+ and US resident',
      creatorEmail: 'techreview@example.com',
      creatorFollowers: '125K',
      riskScore: 'Low',
    },
    {
      id: 2,
      title: '$5000 Cash Prize',
      creator: '@cashgiveaways_daily',
      creatorVerified: false,
      prize: '$5000 USD Cash',
      ticketPrice: 15,
      totalTickets: 500,
      endDate: '2025-07-30',
      category: 'cash',
      submittedDate: '2025-07-17',
      image: null,
      description: 'PayPal cash transfer of $5000 to the winner.',
      requirements: 'PayPal account required, international entries welcome',
      creatorEmail: 'cash@example.com',
      creatorFollowers: '89K',
      riskScore: 'Medium',
    },
    {
      id: 3,
      title: 'Gaming PC Build Giveaway',
      creator: '@gamingsetup_builds',
      creatorVerified: true,
      prize: 'Custom Gaming PC (RTX 4090, i9-13900K)',
      ticketPrice: 12,
      totalTickets: 800,
      endDate: '2025-08-20',
      category: 'gaming',
      submittedDate: '2025-07-16',
      image: null,
      description: 'High-end gaming PC with RTX 4090, Intel i9-13900K, 32GB RAM, 2TB NVMe SSD.',
      requirements: 'Must arrange shipping for large item',
      creatorEmail: 'gaming@example.com',
      creatorFollowers: '256K',
      riskScore: 'Low',
    },
  ];

  useEffect(() => {
    setPendingGiveaways(mockPendingGiveaways);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getRiskColor = (riskScore) => {
    switch (riskScore.toLowerCase()) {
      case 'low': return '#34C759';
      case 'medium': return '#FF9500';
      case 'high': return '#FF3B30';
      default: return '#666';
    }
  };

  const formatTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return 'Ends today';
    } else if (diffDays === 1) {
      return 'Ends in 1 day';
    } else {
      return `Ends in ${diffDays} days`;
    }
  };

  const approveGiveaway = (giveawayId) => {
    Alert.alert(
      'Approve Giveaway',
      'Are you sure you want to approve this giveaway?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: () => {
            // Remove from pending list
            setPendingGiveaways(prev => prev.filter(g => g.id !== giveawayId));
            Alert.alert('Success', 'Giveaway has been approved and is now live!');
            setModalVisible(false);
          },
        },
      ]
    );
  };

  const rejectGiveaway = (giveawayId) => {
    Alert.alert(
      'Reject Giveaway',
      'Are you sure you want to reject this giveaway? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            // Remove from pending list
            setPendingGiveaways(prev => prev.filter(g => g.id !== giveawayId));
            Alert.alert('Rejected', 'Giveaway has been rejected and removed.');
            setModalVisible(false);
          },
        },
      ]
    );
  };

  const renderGiveawayCard = ({ item }) => (
    <TouchableOpacity
      style={styles.giveawayCard}
      onPress={() => {
        setSelectedGiveaway(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.giveawayImage}>
        <View style={styles.placeholderImage}>
          <Ionicons name="gift" size={32} color="#666" />
        </View>
        <View style={styles.riskBadge}>
          <View style={[styles.riskDot, { backgroundColor: getRiskColor(item.riskScore) }]} />
          <Text style={[styles.riskText, { color: getRiskColor(item.riskScore) }]}>
            {item.riskScore} Risk
          </Text>
        </View>
      </View>

      <View style={styles.giveawayInfo}>
        <View style={styles.giveawayHeader}>
          <Text style={styles.giveawayTitle} numberOfLines={2}>{item.title}</Text>
          {item.creatorVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
          )}
        </View>

        <View style={styles.creatorRow}>
          <Text style={styles.creatorName}>{item.creator}</Text>
          <Text style={styles.followers}>{item.creatorFollowers}</Text>
        </View>

        <Text style={styles.prizeText} numberOfLines={1}>{item.prize}</Text>

        <View style={styles.detailsRow}>
          <Text style={styles.ticketPrice}>${item.ticketPrice}/ticket</Text>
          <Text style={styles.endDate}>{formatTimeRemaining(item.endDate)}</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => rejectGiveaway(item.id)}
          >
            <Ionicons name="close" size={16} color="#fff" />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => approveGiveaway(item.id)}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const DetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Giveaway Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedGiveaway && (
            <View style={styles.modalBody}>
              <Text style={styles.modalGiveawayTitle}>{selectedGiveaway.title}</Text>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Creator:</Text>
                <Text style={styles.modalValue}>{selectedGiveaway.creator}</Text>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Prize:</Text>
                <Text style={styles.modalValue}>{selectedGiveaway.prize}</Text>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Description:</Text>
                <Text style={styles.modalValue}>{selectedGiveaway.description}</Text>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Requirements:</Text>
                <Text style={styles.modalValue}>{selectedGiveaway.requirements}</Text>
              </View>
              
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Risk Score:</Text>
                <Text style={[styles.modalValue, { color: getRiskColor(selectedGiveaway.riskScore) }]}>
                  {selectedGiveaway.riskScore}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.modalRejectButton]}
                  onPress={() => rejectGiveaway(selectedGiveaway.id)}
                >
                  <Text style={styles.modalRejectButtonText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionButton, styles.modalApproveButton]}
                  onPress={() => approveGiveaway(selectedGiveaway.id)}
                >
                  <Text style={styles.modalApproveButtonText}>Approve</Text>
                </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Pending Giveaways</Text>
        <View style={styles.headerRight}>
          <Text style={styles.pendingCount}>{pendingGiveaways.length}</Text>
        </View>
      </View>

      <FlatList
        data={pendingGiveaways}
        renderItem={renderGiveawayCard}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.giveawaysList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#34C759" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>No pending giveaways to review</Text>
          </View>
        }
      />

      <DetailModal />
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
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  giveawaysList: {
    padding: 15,
  },
  giveawayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  giveawayImage: {
    height: 120,
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  riskBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '600',
  },
  giveawayInfo: {
    padding: 15,
  },
  giveawayHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  giveawayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  creatorName: {
    fontSize: 14,
    color: '#007AFF',
  },
  followers: {
    fontSize: 12,
    color: '#666',
  },
  prizeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  ticketPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34C759',
  },
  endDate: {
    fontSize: 12,
    color: '#666',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
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
  modalGiveawayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
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
  modalRejectButton: {
    backgroundColor: '#FF3B30',
  },
  modalApproveButton: {
    backgroundColor: '#34C759',
  },
  modalRejectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalApproveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
