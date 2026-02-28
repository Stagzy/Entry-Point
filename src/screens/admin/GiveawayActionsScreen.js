/**
 * GiveawayActionsScreen.js - Individual Giveaway Management
 * 
 * Comprehensive admin interface for managing specific giveaways:
 * - Approve/reject/freeze giveaways
 * - Manual winner selection
 * - Issue refunds
 * - View complete audit trail
 * - Handle disputes and chargebacks
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { ToastContext } from '../../context/ToastContext';
import adminActionsService from '../../services/adminActionsService';

export default function GiveawayActionsScreen({ route, navigation }) {
  const { giveawayId } = route.params;
  const { showToast } = useContext(ToastContext);
  
  const [loading, setLoading] = useState(true);
  const [giveaway, setGiveaway] = useState(null);
  const [entries, setEntries] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    loadGiveawayDetails();
  }, [giveawayId]);

  const loadGiveawayDetails = async () => {
    try {
      setLoading(true);

      const [giveawayResult, entriesResult, auditResult] = await Promise.all([
        // Get giveaway details
        supabase
          .from('giveaways')
          .select(`
            *,
            creator:profiles!creator_id(username, email, full_name),
            winner:profiles!winner_id(username, email, full_name)
          `)
          .eq('id', giveawayId)
          .single(),

        // Get entries
        supabase
          .from('entries')
          .select(`
            *,
            user:profiles!user_id(username, email, full_name)
          `)
          .eq('giveaway_id', giveawayId)
          .order('created_at', { ascending: false }),

        // Get audit log
        supabase
          .from('admin_audit_log')
          .select(`
            *,
            admin:profiles!admin_id(username, full_name)
          `)
          .eq('target_id', giveawayId)
          .eq('target_type', 'giveaway')
          .order('created_at', { ascending: false })
      ]);

      if (giveawayResult.error) {
        throw giveawayResult.error;
      }

      setGiveaway(giveawayResult.data);
      setEntries(entriesResult.data || []);
      setAuditLog(auditResult.data || []);

    } catch (error) {
      console.error('Failed to load giveaway details:', error);
      showToast('Failed to load giveaway details', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action) => {
    setSelectedAction(action);
    setActionReason('');
    setActionNotes('');
    setActionModalVisible(true);
  };

  const executeAction = async () => {
    if (!selectedAction || !actionReason.trim()) {
      showToast('Please provide a reason for this action', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const adminId = (await supabase.auth.getUser()).data.user?.id;
      if (!adminId) {
        throw new Error('Admin authentication required');
      }

      let result;

      switch (selectedAction.type) {
        case 'approve':
          result = await adminActionsService.approveGiveaway(
            giveawayId,
            adminId,
            actionNotes
          );
          break;

        case 'reject':
          result = await adminActionsService.rejectGiveaway(
            giveawayId,
            adminId,
            actionReason,
            actionNotes
          );
          break;

        case 'freeze':
          result = await adminActionsService.freezeGiveaway(
            giveawayId,
            adminId,
            actionReason,
            actionNotes
          );
          break;

        case 'select_winner':
          result = await adminActionsService.selectWinner(
            giveawayId,
            adminId,
            false,
            actionNotes
          );
          break;

        case 'reselect_winner':
          result = await adminActionsService.selectWinner(
            giveawayId,
            adminId,
            true,
            `Reselection reason: ${actionReason}. ${actionNotes}`
          );
          break;

        default:
          throw new Error('Unknown action type');
      }

      if (result.success) {
        showToast(`Action completed successfully`, 'success');
        setActionModalVisible(false);
        loadGiveawayDetails(); // Reload data
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Action failed:', error);
      showToast(error.message || 'Action failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportWinners = async () => {
    try {
      const result = await adminActionsService.exportWinners(giveawayId);
      
      if (result.success) {
        // In a real app, this would trigger a download
        showToast('Winner data exported successfully', 'success');
        console.log('Winner export data:', result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showToast('Export failed', 'error');
    }
  };

  const issueRefund = async (entryId) => {
    Alert.prompt(
      'Issue Refund',
      'Please provide a reason for the refund:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Issue Refund',
          onPress: async (reason) => {
            if (!reason?.trim()) return;

            try {
              const adminId = (await supabase.auth.getUser()).data.user?.id;
              const result = await adminActionsService.issueRefund(
                entryId,
                adminId,
                reason,
                'Manual refund issued from admin console'
              );

              if (result.success) {
                showToast('Refund issued successfully', 'success');
                loadGiveawayDetails();
              } else {
                throw new Error(result.error);
              }
            } catch (error) {
              showToast('Refund failed', 'error');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#34C759';
      case 'pending_approval': return '#FF9500';
      case 'rejected': return '#FF3B30';
      case 'frozen': return '#FF6B6B';
      case 'completed': return '#5856D6';
      default: return '#666';
    }
  };

  const getAvailableActions = () => {
    if (!giveaway) return [];

    const actions = [];

    if (giveaway.status === 'pending_approval') {
      actions.push(
        { type: 'approve', title: 'Approve Giveaway', icon: 'checkmark-circle', color: '#34C759' },
        { type: 'reject', title: 'Reject Giveaway', icon: 'close-circle', color: '#FF3B30' }
      );
    }

    if (['active', 'pending_approval'].includes(giveaway.status)) {
      actions.push(
        { type: 'freeze', title: 'Emergency Freeze', icon: 'pause-circle', color: '#FF6B6B' }
      );
    }

    if (giveaway.status === 'completed' && !giveaway.winner_id) {
      actions.push(
        { type: 'select_winner', title: 'Select Winner', icon: 'trophy', color: '#FFD700' }
      );
    }

    if (giveaway.winner_id) {
      actions.push(
        { type: 'reselect_winner', title: 'Reselect Winner', icon: 'refresh-circle', color: '#FF9500' }
      );
    }

    return actions;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading giveaway details...</Text>
      </View>
    );
  }

  if (!giveaway) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Giveaway not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Giveaway Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{giveaway.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(giveaway.status) }]}>
          <Text style={styles.statusText}>{giveaway.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Giveaway Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Giveaway Information</Text>
        <View style={styles.infoGrid}>
          <InfoItem label="Creator" value={giveaway.creator?.username || 'Unknown'} />
          <InfoItem label="Created" value={new Date(giveaway.created_at).toLocaleDateString()} />
          <InfoItem label="End Date" value={new Date(giveaway.end_date).toLocaleDateString()} />
          <InfoItem label="Entry Cost" value={`$${giveaway.entry_cost}`} />
          <InfoItem label="Total Entries" value={entries.length} />
          <InfoItem label="Total Raised" value={`$${(giveaway.entry_cost * entries.length).toFixed(2)}`} />
          {giveaway.winner && (
            <InfoItem label="Winner" value={giveaway.winner.username} />
          )}
        </View>
      </View>

      {/* Admin Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin Actions</Text>
        <View style={styles.actionsGrid}>
          {getAvailableActions().map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionButton, { borderColor: action.color }]}
              onPress={() => handleAction(action)}
            >
              <Ionicons name={action.icon} size={24} color={action.color} />
              <Text style={[styles.actionText, { color: action.color }]}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: '#5856D6' }]}
            onPress={exportWinners}
          >
            <Ionicons name="download" size={24} color="#5856D6" />
            <Text style={[styles.actionText, { color: '#5856D6' }]}>
              Export Data
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Entries List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Entries ({entries.length})</Text>
        {entries.slice(0, 10).map((entry, index) => (
          <View key={entry.id} style={styles.entryItem}>
            <View style={styles.entryInfo}>
              <Text style={styles.entryUser}>{entry.user?.username || 'Unknown'}</Text>
              <Text style={styles.entryDate}>
                {new Date(entry.created_at).toLocaleString()}
              </Text>
              <Text style={styles.entryAmount}>${entry.total_cost}</Text>
              <Text style={[styles.entryStatus, { 
                color: entry.payment_status === 'completed' ? '#34C759' : '#FF9500' 
              }]}>
                {entry.payment_status}
              </Text>
            </View>
            {entry.payment_status === 'completed' && (
              <TouchableOpacity
                style={styles.refundButton}
                onPress={() => issueRefund(entry.id)}
              >
                <Text style={styles.refundText}>Refund</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {entries.length > 10 && (
          <Text style={styles.moreEntriesText}>
            +{entries.length - 10} more entries
          </Text>
        )}
      </View>

      {/* Audit Log */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin Audit Log</Text>
        {auditLog.length > 0 ? (
          auditLog.map((log, index) => (
            <View key={index} style={styles.auditItem}>
              <View style={styles.auditHeader}>
                <Text style={styles.auditAction}>{log.action.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.auditDate}>
                  {new Date(log.created_at).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.auditAdmin}>By: {log.admin?.username || 'System'}</Text>
              {log.reason && (
                <Text style={styles.auditReason}>{log.reason}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No admin actions recorded</Text>
        )}
      </View>

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedAction?.title}
            </Text>
            
            <Text style={styles.modalLabel}>Reason (Required):</Text>
            <TextInput
              style={styles.modalInput}
              value={actionReason}
              onChangeText={setActionReason}
              placeholder="Enter reason for this action..."
              multiline
              numberOfLines={3}
            />

            <Text style={styles.modalLabel}>Additional Notes (Optional):</Text>
            <TextInput
              style={styles.modalInput}
              value={actionNotes}
              onChangeText={setActionNotes}
              placeholder="Any additional notes..."
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setActionModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={executeAction}
                disabled={!actionReason.trim()}
              >
                <Text style={styles.confirmButtonText}>Execute</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const InfoItem = ({ label, value }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  infoGrid: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  entryInfo: {
    flex: 1,
  },
  entryUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  entryDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  entryAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34C759',
    marginTop: 2,
  },
  entryStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  refundButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refundText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  moreEntriesText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 10,
  },
  auditItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  auditDate: {
    fontSize: 12,
    color: '#666',
  },
  auditAdmin: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  auditReason: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
