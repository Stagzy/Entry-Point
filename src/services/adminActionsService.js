/**
 * adminActionsService.js - Comprehensive Admin Action Management
 * 
 * PURPOSE:
 * Centralized service for all administrative actions with full audit logging.
 * Handles giveaway management, user verification, disputes, and refunds.
 * 
 * FEATURES:
 * - Giveaway approval/freeze with reasons
 * - KYC verification workflow
 * - Winner selection/reselection with audit
 * - Dispute handling and chargeback management
 * - Comprehensive audit logging
 * - Export capabilities for compliance
 */

import { supabase } from '../config/supabase';
import observabilityService from './observabilityService';
import fairnessService from './fairnessService';

class AdminActionsService {
  constructor() {
    this.actionTypes = {
      GIVEAWAY_APPROVE: 'giveaway_approve',
      GIVEAWAY_REJECT: 'giveaway_reject',
      GIVEAWAY_FREEZE: 'giveaway_freeze',
      GIVEAWAY_UNFREEZE: 'giveaway_unfreeze',
      KYC_APPROVE: 'kyc_approve',
      KYC_REJECT: 'kyc_reject',
      WINNER_SELECT: 'winner_select',
      WINNER_RESELECT: 'winner_reselect',
      REFUND_ISSUE: 'refund_issue',
      USER_SUSPEND: 'user_suspend',
      USER_UNSUSPEND: 'user_unsuspend',
      DISPUTE_RESOLVE: 'dispute_resolve',
      CHARGEBACK_HANDLE: 'chargeback_handle'
    };
  }

  /**
   * Approve giveaway for publication
   */
  async approveGiveaway(giveawayId, adminId, notes = '') {
    try {
      // Get giveaway details
      const { data: giveaway, error: fetchError } = await supabase
        .from('giveaways')
        .select('*, creator:profiles(username, email)')
        .eq('id', giveawayId)
        .single();

      if (fetchError || !giveaway) {
        throw new Error('Giveaway not found');
      }

      if (giveaway.status !== 'pending_approval') {
        throw new Error(`Cannot approve giveaway with status: ${giveaway.status}`);
      }

      // Update giveaway status
      const { error: updateError } = await supabase
        .from('giveaways')
        .update({
          status: 'active',
          moderation_status: 'approved',
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          admin_notes: notes
        })
        .eq('id', giveawayId);

      if (updateError) {
        throw updateError;
      }

      // Log admin action
      await this.logAdminAction(
        adminId,
        this.actionTypes.GIVEAWAY_APPROVE,
        'giveaway',
        giveawayId,
        { status: giveaway.status },
        { status: 'active', approved_at: new Date().toISOString() },
        notes
      );

      // Send notification to creator
      await this.sendCreatorNotification(giveaway.creator_id, {
        type: 'giveaway_approved',
        title: 'Giveaway Approved!',
        message: `Your giveaway "${giveaway.title}" has been approved and is now live.`,
        giveawayId
      });

      observabilityService.trackAdmin('giveaway_approved', giveawayId, {
        creatorId: giveaway.creator_id,
        title: giveaway.title
      });

      return { success: true, giveaway };

    } catch (error) {
      console.error('Giveaway approval failed:', error);
      observabilityService.trackError(error, {
        action: 'approve_giveaway',
        giveawayId,
        adminId
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject giveaway with reason
   */
  async rejectGiveaway(giveawayId, adminId, reason, notes = '') {
    try {
      const { data: giveaway, error: fetchError } = await supabase
        .from('giveaways')
        .select('*, creator:profiles(username, email)')
        .eq('id', giveawayId)
        .single();

      if (fetchError || !giveaway) {
        throw new Error('Giveaway not found');
      }

      // Update giveaway status
      const { error: updateError } = await supabase
        .from('giveaways')
        .update({
          status: 'rejected',
          moderation_status: 'rejected',
          rejected_by: adminId,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
          admin_notes: notes
        })
        .eq('id', giveawayId);

      if (updateError) {
        throw updateError;
      }

      // Log admin action
      await this.logAdminAction(
        adminId,
        this.actionTypes.GIVEAWAY_REJECT,
        'giveaway',
        giveawayId,
        { status: giveaway.status },
        { status: 'rejected', rejection_reason: reason },
        `${reason}. ${notes}`
      );

      // Send notification to creator
      await this.sendCreatorNotification(giveaway.creator_id, {
        type: 'giveaway_rejected',
        title: 'Giveaway Requires Changes',
        message: `Your giveaway "${giveaway.title}" needs changes: ${reason}`,
        giveawayId,
        actionRequired: true
      });

      observabilityService.trackAdmin('giveaway_rejected', giveawayId, {
        reason,
        creatorId: giveaway.creator_id
      });

      return { success: true, giveaway };

    } catch (error) {
      console.error('Giveaway rejection failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Freeze giveaway (emergency stop)
   */
  async freezeGiveaway(giveawayId, adminId, reason, notes = '') {
    try {
      const { data: giveaway, error: fetchError } = await supabase
        .from('giveaways')
        .select('*')
        .eq('id', giveawayId)
        .single();

      if (fetchError || !giveaway) {
        throw new Error('Giveaway not found');
      }

      const oldStatus = giveaway.status;

      // Update giveaway status
      const { error: updateError } = await supabase
        .from('giveaways')
        .update({
          status: 'frozen',
          frozen_by: adminId,
          frozen_at: new Date().toISOString(),
          freeze_reason: reason,
          admin_notes: notes,
          previous_status: oldStatus
        })
        .eq('id', giveawayId);

      if (updateError) {
        throw updateError;
      }

      // Stop any active payments
      await this.freezeGiveawayPayments(giveawayId);

      // Log admin action
      await this.logAdminAction(
        adminId,
        this.actionTypes.GIVEAWAY_FREEZE,
        'giveaway',
        giveawayId,
        { status: oldStatus },
        { status: 'frozen', freeze_reason: reason },
        `Emergency freeze: ${reason}. ${notes}`
      );

      observabilityService.trackSecurity('giveaway_frozen', {
        giveawayId,
        adminId,
        reason,
        previousStatus: oldStatus
      });

      return { success: true, giveaway };

    } catch (error) {
      console.error('Giveaway freeze failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify user KYC
   */
  async approveKYC(userId, adminId, verificationLevel = 2, notes = '') {
    try {
      // Update user verification status
      const { error: updateError } = await supabase
        .from('user_verifications')
        .upsert({
          user_id: userId,
          verification_status: 'verified',
          verification_level: verificationLevel,
          documents_verified: true,
          identity_verified: true,
          verified_by: adminId,
          verification_completed_at: new Date().toISOString(),
          admin_notes: notes
        });

      if (updateError) {
        throw updateError;
      }

      // Update user profile
      await supabase
        .from('profiles')
        .update({
          is_verified: true,
          verification_level: verificationLevel
        })
        .eq('id', userId);

      // Log admin action
      await this.logAdminAction(
        adminId,
        this.actionTypes.KYC_APPROVE,
        'user',
        userId,
        { verification_status: 'pending' },
        { verification_status: 'verified', level: verificationLevel },
        notes
      );

      // Send notification to user
      await this.sendUserNotification(userId, {
        type: 'kyc_approved',
        title: 'Account Verified!',
        message: 'Your identity has been verified. You can now create giveaways.',
        actionRequired: false
      });

      observabilityService.trackAdmin('kyc_approved', userId, {
        verificationLevel,
        adminId
      });

      return { success: true };

    } catch (error) {
      console.error('KYC approval failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Manually select or reselect winner
   */
  async selectWinner(giveawayId, adminId, forceReselection = false, notes = '') {
    try {
      const { data: giveaway, error: fetchError } = await supabase
        .from('giveaways')
        .select('*, entries(*)')
        .eq('id', giveawayId)
        .single();

      if (fetchError || !giveaway) {
        throw new Error('Giveaway not found');
      }

      if (!forceReselection && giveaway.winner_id) {
        throw new Error('Giveaway already has a winner. Use forceReselection=true to override.');
      }

      const previousWinnerId = giveaway.winner_id;

      // Use fairness service for verifiable selection
      const selectionResult = await fairnessService.selectVerifiableWinner(giveawayId);

      if (!selectionResult.data) {
        throw new Error('Winner selection failed');
      }

      const newWinnerId = selectionResult.data.winner.user_id;

      // Log admin action
      await this.logAdminAction(
        adminId,
        forceReselection ? this.actionTypes.WINNER_RESELECT : this.actionTypes.WINNER_SELECT,
        'giveaway',
        giveawayId,
        { winner_id: previousWinnerId },
        { winner_id: newWinnerId },
        `${forceReselection ? 'Reselected' : 'Selected'} winner: ${newWinnerId}. ${notes}`
      );

      // Send notifications
      if (previousWinnerId && forceReselection) {
        await this.sendUserNotification(previousWinnerId, {
          type: 'winner_changed',
          title: 'Winner Status Update',
          message: 'The giveaway winner has been reselected due to administrative review.',
          giveawayId
        });
      }

      await this.sendUserNotification(newWinnerId, {
        type: 'winner_selected',
        title: 'Congratulations!',
        message: `You won the giveaway: ${giveaway.title}`,
        giveawayId,
        actionRequired: true
      });

      observabilityService.trackAdmin(
        forceReselection ? 'winner_reselected' : 'winner_selected',
        giveawayId,
        {
          previousWinnerId,
          newWinnerId,
          totalEntries: giveaway.entries?.length || 0
        }
      );

      return {
        success: true,
        winner: selectionResult.data.winner,
        proof: selectionResult.data.proof
      };

    } catch (error) {
      console.error('Winner selection failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Issue refund for entry
   */
  async issueRefund(entryId, adminId, reason, notes = '') {
    try {
      // Get entry details
      const { data: entry, error: fetchError } = await supabase
        .from('entries')
        .select('*, giveaway:giveaways(title), user:profiles(email)')
        .eq('id', entryId)
        .single();

      if (fetchError || !entry) {
        throw new Error('Entry not found');
      }

      if (entry.payment_status !== 'completed') {
        throw new Error('Can only refund completed payments');
      }

      // Create refund record
      const { data: refund, error: refundError } = await supabase
        .from('refunds')
        .insert({
          entry_id: entryId,
          user_id: entry.user_id,
          giveaway_id: entry.giveaway_id,
          amount: entry.total_cost,
          reason: reason,
          status: 'processing',
          initiated_by: adminId,
          admin_notes: notes
        })
        .select()
        .single();

      if (refundError) {
        throw refundError;
      }

      // Process refund through Stripe (this would be done via edge function)
      const refundResult = await this.processStripeRefund(entry.payment_id, entry.total_cost);

      if (refundResult.success) {
        // Update refund status
        await supabase
          .from('refunds')
          .update({
            status: 'completed',
            stripe_refund_id: refundResult.refundId,
            completed_at: new Date().toISOString()
          })
          .eq('id', refund.id);

        // Update entry status
        await supabase
          .from('entries')
          .update({
            payment_status: 'refunded',
            refunded_at: new Date().toISOString()
          })
          .eq('id', entryId);
      } else {
        // Update refund status as failed
        await supabase
          .from('refunds')
          .update({
            status: 'failed',
            error_message: refundResult.error
          })
          .eq('id', refund.id);

        throw new Error(`Refund processing failed: ${refundResult.error}`);
      }

      // Log admin action
      await this.logAdminAction(
        adminId,
        this.actionTypes.REFUND_ISSUE,
        'entry',
        entryId,
        { payment_status: 'completed' },
        { payment_status: 'refunded', refund_amount: entry.total_cost },
        `Refund issued: ${reason}. ${notes}`
      );

      // Send notification to user
      await this.sendUserNotification(entry.user_id, {
        type: 'refund_issued',
        title: 'Refund Processed',
        message: `Your refund of $${entry.total_cost} for "${entry.giveaway.title}" has been processed.`,
        actionRequired: false
      });

      observabilityService.trackAdmin('refund_issued', entryId, {
        amount: entry.total_cost,
        reason,
        userId: entry.user_id
      });

      return { success: true, refund };

    } catch (error) {
      console.error('Refund failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle chargeback dispute
   */
  async handleChargeback(paymentIntentId, adminId, action, notes = '') {
    try {
      // Find related entry
      const { data: entry, error: fetchError } = await supabase
        .from('entries')
        .select('*, giveaway:giveaways(*)')
        .eq('payment_id', paymentIntentId)
        .single();

      if (fetchError || !entry) {
        throw new Error('Entry not found for payment');
      }

      // Auto-freeze giveaway if still active
      if (entry.giveaway.status === 'active') {
        await this.freezeGiveaway(
          entry.giveaway_id,
          adminId,
          'Chargeback dispute received',
          `Payment ID: ${paymentIntentId}`
        );
      }

      // Create dispute record
      const { data: dispute, error: disputeError } = await supabase
        .from('payment_disputes')
        .insert({
          payment_intent_id: paymentIntentId,
          entry_id: entry.id,
          user_id: entry.user_id,
          giveaway_id: entry.giveaway_id,
          dispute_type: 'chargeback',
          status: 'open',
          amount: entry.total_cost,
          handled_by: adminId,
          admin_action: action,
          admin_notes: notes
        })
        .select()
        .single();

      if (disputeError) {
        throw disputeError;
      }

      // Log admin action
      await this.logAdminAction(
        adminId,
        this.actionTypes.CHARGEBACK_HANDLE,
        'payment',
        paymentIntentId,
        { status: 'completed' },
        { status: 'disputed', action: action },
        `Chargeback handled: ${action}. ${notes}`
      );

      // Contact creator
      await this.sendCreatorNotification(entry.giveaway.creator_id, {
        type: 'chargeback_dispute',
        title: 'Chargeback Dispute - Action Required',
        message: `A chargeback has been filed for your giveaway "${entry.giveaway.title}". Please review the dispute and provide documentation.`,
        giveawayId: entry.giveaway_id,
        actionRequired: true,
        priority: 'high'
      });

      observabilityService.trackSecurity('chargeback_handled', {
        paymentIntentId,
        giveawayId: entry.giveaway_id,
        action,
        amount: entry.total_cost
      });

      return { success: true, dispute };

    } catch (error) {
      console.error('Chargeback handling failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export winners for compliance
   */
  async exportWinners(giveawayId = null, startDate = null, endDate = null) {
    try {
      let query = supabase
        .from('giveaways')
        .select(`
          id,
          title,
          creator_id,
          winner_id,
          winner_selected_at,
          end_date,
          total_entries,
          total_raised,
          creator:profiles!creator_id(username, email, full_name),
          winner:profiles!winner_id(username, email, full_name),
          fairness_proof:fairness_proofs(seed_hash, winner_hash, verified_at)
        `)
        .not('winner_id', 'is', null);

      if (giveawayId) {
        query = query.eq('id', giveawayId);
      }

      if (startDate) {
        query = query.gte('winner_selected_at', startDate);
      }

      if (endDate) {
        query = query.lte('winner_selected_at', endDate);
      }

      const { data: winners, error } = await query.order('winner_selected_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Format for CSV export
      const csvData = winners.map(giveaway => ({
        'Giveaway ID': giveaway.id,
        'Giveaway Title': giveaway.title,
        'Creator Username': giveaway.creator?.username || 'Unknown',
        'Creator Email': giveaway.creator?.email || 'Unknown',
        'Winner Username': giveaway.winner?.username || 'Unknown',
        'Winner Email': giveaway.winner?.email || 'Unknown',
        'Winner Full Name': giveaway.winner?.full_name || 'Unknown',
        'Selected At': giveaway.winner_selected_at,
        'End Date': giveaway.end_date,
        'Total Entries': giveaway.total_entries || 0,
        'Total Raised': giveaway.total_raised || 0,
        'Fairness Proof Hash': giveaway.fairness_proof?.seed_hash || 'N/A',
        'Verified At': giveaway.fairness_proof?.verified_at || 'N/A'
      }));

      observabilityService.trackAdmin('winners_exported', null, {
        count: csvData.length,
        giveawayId,
        dateRange: { startDate, endDate }
      });

      return { success: true, data: csvData };

    } catch (error) {
      console.error('Winners export failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log admin action for audit trail
   */
  async logAdminAction(adminId, action, targetType, targetId, oldValues, newValues, reason) {
    try {
      const { error } = await supabase
        .from('admin_audit_log')
        .insert({
          admin_id: adminId,
          action: action,
          target_type: targetType,
          target_id: targetId,
          old_values: oldValues,
          new_values: newValues,
          reason: reason,
          ip_address: await this.getClientIP(),
          user_agent: navigator?.userAgent || 'Unknown'
        });

      if (error) {
        console.error('Failed to log admin action:', error);
      }
    } catch (error) {
      console.error('Admin action logging error:', error);
    }
  }

  /**
   * Send notification to creator
   */
  async sendCreatorNotification(userId, notification) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: {
            giveawayId: notification.giveawayId,
            actionRequired: notification.actionRequired || false,
            priority: notification.priority || 'normal'
          },
          read: false
        });

      if (error) {
        console.error('Failed to send creator notification:', error);
      }
    } catch (error) {
      console.error('Creator notification error:', error);
    }
  }

  /**
   * Send notification to user
   */
  async sendUserNotification(userId, notification) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: {
            giveawayId: notification.giveawayId,
            actionRequired: notification.actionRequired || false
          },
          read: false
        });

      if (error) {
        console.error('Failed to send user notification:', error);
      }
    } catch (error) {
      console.error('User notification error:', error);
    }
  }

  /**
   * Process Stripe refund (mock - would be edge function)
   */
  async processStripeRefund(paymentIntentId, amount) {
    try {
      // This would be handled by an edge function
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        refundId: `re_mock_${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Freeze giveaway payments
   */
  async freezeGiveawayPayments(giveawayId) {
    try {
      // This would disable Stripe payment processing for the giveaway
      console.log(`Freezing payments for giveaway: ${giveawayId}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to freeze payments:', error);
      return { success: false };
    }
  }

  /**
   * Get client IP address
   */
  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get admin dashboard statistics
   */
  async getAdminStats() {
    try {
      const [
        pendingGiveaways,
        pendingKYC,
        openDisputes,
        recentActions
      ] = await Promise.all([
        supabase.from('giveaways').select('id').eq('status', 'pending_approval'),
        supabase.from('user_verifications').select('id').eq('verification_status', 'pending'),
        supabase.from('payment_disputes').select('id').eq('status', 'open'),
        supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(10)
      ]);

      return {
        pendingGiveaways: pendingGiveaways.data?.length || 0,
        pendingKYC: pendingKYC.data?.length || 0,
        openDisputes: openDisputes.data?.length || 0,
        recentActions: recentActions.data || []
      };
    } catch (error) {
      console.error('Failed to get admin stats:', error);
      return {
        pendingGiveaways: 0,
        pendingKYC: 0,
        openDisputes: 0,
        recentActions: []
      };
    }
  }
}

export default new AdminActionsService();
