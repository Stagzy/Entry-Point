/**
 * supportService.js - Comprehensive Customer Support System
 * 
 * PURPOSE:
 * Complete support infrastructure with FAQ, ticketing, canned responses,
 * and integration with admin console for dispute resolution.
 * 
 * FEATURES:
 * - Smart FAQ system with search
 * - Support ticket management
 * - Canned response templates
 * - Integration with admin actions
 * - Dispute escalation workflow
 * - Real-time support chat capability
 */

import { supabase } from '../config/supabase';
import observabilityService from './observabilityService';

class SupportService {
  constructor() {
    this.ticketTypes = {
      GENERAL: 'general',
      PAYMENT: 'payment',
      GIVEAWAY: 'giveaway',
      ACCOUNT: 'account',
      DISPUTE: 'dispute',
      TECHNICAL: 'technical',
      REFUND: 'refund'
    };

    this.ticketPriorities = {
      LOW: 'low',
      NORMAL: 'normal',
      HIGH: 'high',
      URGENT: 'urgent'
    };

    this.ticketStatuses = {
      OPEN: 'open',
      PENDING: 'pending_response',
      ESCALATED: 'escalated',
      RESOLVED: 'resolved',
      CLOSED: 'closed'
    };
  }

  /**
   * Get FAQ items with search functionality
   */
  async getFAQs(searchQuery = null, category = null) {
    try {
      let query = supabase
        .from('faq_items')
        .select('*')
        .eq('published', true)
        .order('display_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      if (searchQuery) {
        query = query.or(`question.ilike.%${searchQuery}%,answer.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
      }

      const { data: faqs, error } = await query;

      if (error) {
        throw error;
      }

      // Track FAQ search for analytics
      if (searchQuery) {
        observabilityService.trackSupport('faq_searched', {
          query: searchQuery,
          category,
          resultsCount: faqs.length
        });
      }

      return { success: true, data: faqs };

    } catch (error) {
      console.error('FAQ fetch failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create support ticket
   */
  async createTicket(userId, ticketData) {
    try {
      const ticketNumber = this.generateTicketNumber();

      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
          ticket_number: ticketNumber,
          user_id: userId,
          type: ticketData.type || this.ticketTypes.GENERAL,
          priority: this.determinePriority(ticketData),
          status: this.ticketStatuses.OPEN,
          subject: ticketData.subject,
          description: ticketData.description,
          category: ticketData.category,
          metadata: {
            browser: navigator?.userAgent || 'Unknown',
            url: window?.location?.href || 'Unknown',
            ...ticketData.metadata
          }
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add initial message
      await this.addTicketMessage(ticket.id, userId, ticketData.description, 'user');

      // Auto-assign based on type
      const assignedAgent = await this.autoAssignTicket(ticket);

      // Send confirmation to user
      await this.sendTicketConfirmation(userId, ticket);

      observabilityService.trackSupport('ticket_created', {
        ticketId: ticket.id,
        type: ticket.type,
        priority: ticket.priority,
        userId
      });

      return { success: true, data: ticket };

    } catch (error) {
      console.error('Ticket creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add message to ticket
   */
  async addTicketMessage(ticketId, userId, message, messageType = 'user', attachments = []) {
    try {
      // Check if user can access this ticket
      const hasAccess = await this.checkTicketAccess(ticketId, userId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const { data: ticketMessage, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          message: message,
          message_type: messageType,
          attachments: attachments
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update ticket status
      const newStatus = messageType === 'user' ? this.ticketStatuses.PENDING : this.ticketStatuses.OPEN;
      await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          last_response_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      // Send notification
      await this.sendTicketUpdateNotification(ticketId, messageType, userId);

      observabilityService.trackSupport('ticket_message_added', {
        ticketId,
        messageType,
        hasAttachments: attachments.length > 0
      });

      return { success: true, data: ticketMessage };

    } catch (error) {
      console.error('Add ticket message failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get canned responses
   */
  async getCannedResponses(category = null, searchQuery = null) {
    try {
      let query = supabase
        .from('canned_responses')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true })
        .order('title', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
      }

      const { data: responses, error } = await query;

      if (error) {
        throw error;
      }

      return { success: true, data: responses };

    } catch (error) {
      console.error('Canned responses fetch failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Use canned response in ticket
   */
  async useCannedResponse(ticketId, responseId, agentId, customizations = {}) {
    try {
      // Get canned response
      const { data: cannedResponse, error: responseError } = await supabase
        .from('canned_responses')
        .select('*')
        .eq('id', responseId)
        .single();

      if (responseError || !cannedResponse) {
        throw new Error('Canned response not found');
      }

      // Get ticket info for personalization
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*, user:profiles(name, username)')
        .eq('id', ticketId)
        .single();

      if (ticketError || !ticket) {
        throw new Error('Ticket not found');
      }

      // Personalize response
      let personalizedContent = cannedResponse.content;
      personalizedContent = personalizedContent.replace('{{user_name}}', ticket.user?.name || ticket.user?.username || 'there');
      personalizedContent = personalizedContent.replace('{{ticket_number}}', ticket.ticket_number);
      
      // Apply customizations
      if (customizations.replacements) {
        Object.entries(customizations.replacements).forEach(([key, value]) => {
          personalizedContent = personalizedContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
      }

      // Add custom message if provided
      if (customizations.additionalMessage) {
        personalizedContent += `\n\n${customizations.additionalMessage}`;
      }

      // Add message to ticket
      const messageResult = await this.addTicketMessage(
        ticketId,
        agentId,
        personalizedContent,
        'agent'
      );

      if (!messageResult.success) {
        throw new Error('Failed to add canned response to ticket');
      }

      // Track usage
      await supabase
        .from('canned_response_usage')
        .insert({
          response_id: responseId,
          ticket_id: ticketId,
          used_by: agentId,
          customizations: customizations
        });

      observabilityService.trackSupport('canned_response_used', {
        ticketId,
        responseId,
        agentId,
        hasCustomizations: Object.keys(customizations).length > 0
      });

      return { success: true, data: messageResult.data };

    } catch (error) {
      console.error('Canned response usage failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Escalate ticket to admin
   */
  async escalateTicket(ticketId, agentId, reason, adminId = null) {
    try {
      // Update ticket status
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({
          status: this.ticketStatuses.ESCALATED,
          escalated_at: new Date().toISOString(),
          escalated_by: agentId,
          escalation_reason: reason,
          assigned_to: adminId
        })
        .eq('id', ticketId);

      if (updateError) {
        throw updateError;
      }

      // Add escalation message
      await this.addTicketMessage(
        ticketId,
        agentId,
        `Ticket escalated to admin level.\nReason: ${reason}`,
        'system'
      );

      // Notify admin
      if (adminId) {
        await this.sendTicketEscalationNotification(ticketId, adminId, reason);
      }

      observabilityService.trackSupport('ticket_escalated', {
        ticketId,
        agentId,
        adminId,
        reason
      });

      return { success: true };

    } catch (error) {
      console.error('Ticket escalation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark ticket as resolved
   */
  async resolveTicket(ticketId, agentId, resolution, sendSurvey = true) {
    try {
      // Update ticket status
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({
          status: this.ticketStatuses.RESOLVED,
          resolved_at: new Date().toISOString(),
          resolved_by: agentId,
          resolution: resolution
        })
        .eq('id', ticketId);

      if (updateError) {
        throw updateError;
      }

      // Add resolution message
      await this.addTicketMessage(
        ticketId,
        agentId,
        `Ticket resolved: ${resolution}`,
        'agent'
      );

      // Send satisfaction survey
      if (sendSurvey) {
        await this.sendSatisfactionSurvey(ticketId);
      }

      observabilityService.trackSupport('ticket_resolved', {
        ticketId,
        agentId,
        resolutionProvided: !!resolution
      });

      return { success: true };

    } catch (error) {
      console.error('Ticket resolution failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create dispute from support ticket
   */
  async createDisputeFromTicket(ticketId, adminId, disputeData) {
    try {
      // Get ticket details
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (ticketError || !ticket) {
        throw new Error('Ticket not found');
      }

      // Create dispute record
      const { data: dispute, error: disputeError } = await supabase
        .from('payment_disputes')
        .insert({
          original_ticket_id: ticketId,
          user_id: ticket.user_id,
          dispute_type: disputeData.type || 'support_escalation',
          status: 'open',
          description: disputeData.description,
          amount: disputeData.amount,
          payment_intent_id: disputeData.paymentIntentId,
          entry_id: disputeData.entryId,
          giveaway_id: disputeData.giveawayId,
          handled_by: adminId,
          priority: 'high'
        })
        .select()
        .single();

      if (disputeError) {
        throw disputeError;
      }

      // Link ticket to dispute
      await supabase
        .from('support_tickets')
        .update({
          status: this.ticketStatuses.ESCALATED,
          linked_dispute_id: dispute.id
        })
        .eq('id', ticketId);

      observabilityService.trackSupport('dispute_created_from_ticket', {
        ticketId,
        disputeId: dispute.id,
        adminId
      });

      return { success: true, data: dispute };

    } catch (error) {
      console.error('Dispute creation from ticket failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get support analytics
   */
  async getSupportAnalytics(startDate, endDate) {
    try {
      const [
        ticketStats,
        responseTimeStats,
        satisfactionStats,
        topCategories
      ] = await Promise.all([
        this.getTicketStats(startDate, endDate),
        this.getResponseTimeStats(startDate, endDate),
        this.getSatisfactionStats(startDate, endDate),
        this.getTopCategories(startDate, endDate)
      ]);

      return {
        success: true,
        data: {
          tickets: ticketStats,
          responseTimes: responseTimeStats,
          satisfaction: satisfactionStats,
          categories: topCategories
        }
      };

    } catch (error) {
      console.error('Support analytics failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods

  generateTicketNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `TK-${timestamp}-${random}`;
  }

  determinePriority(ticketData) {
    // Auto-determine priority based on type and keywords
    const urgentKeywords = ['fraud', 'hack', 'stolen', 'emergency', 'urgent', 'chargeback'];
    const highKeywords = ['payment', 'refund', 'dispute', 'winner', 'error'];

    const content = `${ticketData.subject} ${ticketData.description}`.toLowerCase();

    if (urgentKeywords.some(keyword => content.includes(keyword))) {
      return this.ticketPriorities.URGENT;
    }

    if (highKeywords.some(keyword => content.includes(keyword))) {
      return this.ticketPriorities.HIGH;
    }

    if (ticketData.type === this.ticketTypes.PAYMENT || ticketData.type === this.ticketTypes.DISPUTE) {
      return this.ticketPriorities.HIGH;
    }

    return this.ticketPriorities.NORMAL;
  }

  async autoAssignTicket(ticket) {
    try {
      // Simple round-robin assignment based on availability
      const { data: agents, error } = await supabase
        .from('support_agents')
        .select('id, current_load')
        .eq('available', true)
        .eq('specialization', ticket.type)
        .order('current_load', { ascending: true })
        .limit(1);

      if (error || !agents || agents.length === 0) {
        return null;
      }

      const assignedAgent = agents[0];

      await supabase
        .from('support_tickets')
        .update({ assigned_to: assignedAgent.id })
        .eq('id', ticket.id);

      return assignedAgent;

    } catch (error) {
      console.error('Auto-assignment failed:', error);
      return null;
    }
  }

  async checkTicketAccess(ticketId, userId) {
    try {
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .select('user_id, assigned_to')
        .eq('id', ticketId)
        .single();

      if (error || !ticket) {
        return false;
      }

      return ticket.user_id === userId || ticket.assigned_to === userId;

    } catch (error) {
      return false;
    }
  }

  async sendTicketConfirmation(userId, ticket) {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'support_ticket_created',
          title: 'Support Ticket Created',
          message: `Your support ticket ${ticket.ticket_number} has been created. We'll respond within 24 hours.`,
          data: { ticketId: ticket.id, ticketNumber: ticket.ticket_number }
        });
    } catch (error) {
      console.error('Failed to send ticket confirmation:', error);
    }
  }

  async sendTicketUpdateNotification(ticketId, messageType, userId) {
    // Implementation for real-time notifications
    console.log(`Ticket ${ticketId} updated by ${messageType} from user ${userId}`);
  }

  async sendTicketEscalationNotification(ticketId, adminId, reason) {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: adminId,
          type: 'ticket_escalated',
          title: 'Ticket Escalated',
          message: `A support ticket has been escalated to you. Reason: ${reason}`,
          data: { ticketId, reason, priority: 'high' }
        });
    } catch (error) {
      console.error('Failed to send escalation notification:', error);
    }
  }

  async sendSatisfactionSurvey(ticketId) {
    try {
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .select('user_id, ticket_number')
        .eq('id', ticketId)
        .single();

      if (error || !ticket) {
        return;
      }

      await supabase
        .from('notifications')
        .insert({
          user_id: ticket.user_id,
          type: 'satisfaction_survey',
          title: 'How was our support?',
          message: `Please rate your experience with ticket ${ticket.ticket_number}`,
          data: { ticketId, surveyType: 'satisfaction' }
        });
    } catch (error) {
      console.error('Failed to send satisfaction survey:', error);
    }
  }

  async getTicketStats(startDate, endDate) {
    // Implementation for ticket statistics
    return {
      total: 0,
      open: 0,
      resolved: 0,
      escalated: 0
    };
  }

  async getResponseTimeStats(startDate, endDate) {
    // Implementation for response time analytics
    return {
      averageFirstResponse: 0,
      averageResolution: 0
    };
  }

  async getSatisfactionStats(startDate, endDate) {
    // Implementation for satisfaction metrics
    return {
      averageRating: 0,
      responseRate: 0
    };
  }

  async getTopCategories(startDate, endDate) {
    // Implementation for category analytics
    return [];
  }
}

export default new SupportService();
