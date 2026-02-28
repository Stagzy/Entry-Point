/**
 * webhookReliabilityService.js - Webhook Reliability & Idempotency
 * 
 * PURPOSE:
 * Ensure reliable webhook processing with replay capability and deduplication.
 * Critical for payment processing and maintaining data consistency.
 * 
 * FEATURES:
 * - Idempotent webhook processing
 * - Automatic retry with exponential backoff
 * - Webhook replay for failed deliveries
 * - Duplicate detection and prevention
 * - Comprehensive audit trail
 */

import { supabase } from '../config/supabase';
import observabilityService from './observabilityService';

class WebhookReliabilityService {
  constructor() {
    this.maxRetries = 5;
    this.initialRetryDelay = 1000; // 1 second
    this.maxRetryDelay = 300000;   // 5 minutes
    
    // Webhook event handlers
    this.handlers = new Map();
    this.setupDefaultHandlers();
  }

  /**
   * Register webhook event handlers
   */
  setupDefaultHandlers() {
    // Stripe payment webhooks
    this.registerHandler('payment_intent.succeeded', this.handlePaymentSuccess.bind(this));
    this.registerHandler('payment_intent.payment_failed', this.handlePaymentFailed.bind(this));
    this.registerHandler('account.updated', this.handleAccountUpdated.bind(this));
    this.registerHandler('transfer.created', this.handleTransferCreated.bind(this));
    
    // Internal webhooks
    this.registerHandler('giveaway.ended', this.handleGiveawayEnded.bind(this));
    this.registerHandler('user.verified', this.handleUserVerified.bind(this));
  }

  /**
   * Register a webhook event handler
   */
  registerHandler(eventType, handler) {
    this.handlers.set(eventType, handler);
  }

  /**
   * Process incoming webhook with idempotency
   */
  async processWebhook(webhookId, eventType, payload, signature = null) {
    try {
      observabilityService.addBreadcrumb('webhook', 'Processing webhook', {
        webhookId,
        eventType
      });

      // Step 1: Record webhook delivery attempt
      const deliveryId = await this.recordDelivery(webhookId, eventType, payload);

      // Step 2: Check if already processed (idempotency)
      const existingDelivery = await this.getExistingDelivery(webhookId, eventType);
      if (existingDelivery?.status === 'succeeded') {
        observabilityService.trackSecurity('webhook_duplicate_detected', {
          webhookId,
          eventType,
          originalProcessedAt: existingDelivery.processed_at
        });
        
        return {
          success: true,
          duplicate: true,
          deliveryId: existingDelivery.id
        };
      }

      // Step 3: Validate webhook signature if provided
      if (signature) {
        const isValid = await this.validateSignature(payload, signature);
        if (!isValid) {
          await this.updateDeliveryStatus(deliveryId, 'failed', 'Invalid signature');
          return {
            success: false,
            error: 'Invalid webhook signature'
          };
        }
      }

      // Step 4: Update status to processing
      await this.updateDeliveryStatus(deliveryId, 'processing');

      // Step 5: Process the webhook
      const handler = this.handlers.get(eventType);
      if (!handler) {
        await this.updateDeliveryStatus(deliveryId, 'failed', `No handler for event type: ${eventType}`);
        return {
          success: false,
          error: `Unsupported event type: ${eventType}`
        };
      }

      const result = await this.executeWithRetry(handler, payload, webhookId);

      // Step 6: Update final status
      if (result.success) {
        await this.updateDeliveryStatus(deliveryId, 'succeeded');
        observabilityService.trackKPI('webhook_processed', 1, { eventType });
      } else {
        await this.updateDeliveryStatus(deliveryId, 'failed', result.error);
        await this.scheduleRetry(deliveryId, eventType);
      }

      return {
        success: result.success,
        deliveryId,
        error: result.error
      };

    } catch (error) {
      console.error('Webhook processing failed:', error);
      observabilityService.trackError(error, {
        webhookId,
        eventType,
        action: 'process_webhook'
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Record webhook delivery attempt
   */
  async recordDelivery(webhookId, eventType, payload) {
    try {
      const { data, error } = await supabase
        .rpc('record_webhook_delivery', {
          p_webhook_id: webhookId,
          p_event_type: eventType,
          p_payload: payload,
          p_status: 'pending'
        });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to record webhook delivery:', error);
      throw error;
    }
  }

  /**
   * Get existing webhook delivery
   */
  async getExistingDelivery(webhookId, eventType) {
    try {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('webhook_id', webhookId)
        .eq('event_type', eventType)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get existing delivery:', error);
      return null;
    }
  }

  /**
   * Update webhook delivery status
   */
  async updateDeliveryStatus(deliveryId, status, errorMessage = null) {
    try {
      await supabase
        .rpc('update_webhook_delivery_status', {
          p_webhook_id: deliveryId,
          p_event_type: '', // Will be handled by function
          p_status: status,
          p_error_message: errorMessage
        });
    } catch (error) {
      console.error('Failed to update delivery status:', error);
    }
  }

  /**
   * Execute handler with retry logic
   */
  async executeWithRetry(handler, payload, webhookId, attempt = 1) {
    try {
      await handler(payload, webhookId);
      return { success: true };
    } catch (error) {
      console.error(`Handler execution failed (attempt ${attempt}):`, error);
      
      if (attempt < this.maxRetries) {
        const delay = Math.min(
          this.initialRetryDelay * Math.pow(2, attempt - 1),
          this.maxRetryDelay
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(handler, payload, webhookId, attempt + 1);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Schedule webhook retry
   */
  async scheduleRetry(deliveryId, eventType) {
    try {
      const retryDelay = this.calculateRetryDelay(1); // Start with attempt 1
      const retryTime = new Date(Date.now() + retryDelay);

      await supabase
        .from('webhook_deliveries')
        .update({
          status: 'retrying',
          next_retry_at: retryTime.toISOString()
        })
        .eq('id', deliveryId);

      observabilityService.trackSecurity('webhook_retry_scheduled', {
        deliveryId,
        eventType,
        retryAt: retryTime.toISOString()
      });

    } catch (error) {
      console.error('Failed to schedule retry:', error);
    }
  }

  /**
   * Process webhook retries
   */
  async processRetries() {
    try {
      const now = new Date().toISOString();
      
      const { data: retries, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('status', 'retrying')
        .lte('next_retry_at', now)
        .limit(50);

      if (error || !retries?.length) {
        return;
      }

      for (const retry of retries) {
        await this.retryWebhook(retry);
      }

    } catch (error) {
      console.error('Retry processing failed:', error);
    }
  }

  /**
   * Retry a failed webhook
   */
  async retryWebhook(delivery) {
    try {
      const result = await this.processWebhook(
        delivery.webhook_id,
        delivery.event_type,
        delivery.payload
      );

      if (!result.success && delivery.attempt_count >= this.maxRetries) {
        // Max retries exceeded - mark as failed
        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'failed',
            error_message: 'Max retries exceeded'
          })
          .eq('id', delivery.id);

        observabilityService.trackSecurity('webhook_max_retries_exceeded', {
          deliveryId: delivery.id,
          eventType: delivery.event_type,
          attempts: delivery.attempt_count
        });
      }

    } catch (error) {
      console.error('Webhook retry failed:', error);
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt) {
    return Math.min(
      this.initialRetryDelay * Math.pow(2, attempt - 1),
      this.maxRetryDelay
    );
  }

  /**
   * Validate webhook signature
   */
  async validateSignature(payload, signature) {
    try {
      // Mock signature validation - implement with actual webhook secret
      const expectedSignature = 'mock_signature_' + JSON.stringify(payload).length;
      return signature === expectedSignature;
    } catch (error) {
      console.error('Signature validation failed:', error);
      return false;
    }
  }

  /**
   * Replay webhook manually
   */
  async replayWebhook(deliveryId) {
    try {
      const { data: delivery, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('id', deliveryId)
        .single();

      if (error || !delivery) {
        return {
          success: false,
          error: 'Webhook delivery not found'
        };
      }

      // Reset delivery status
      await supabase
        .from('webhook_deliveries')
        .update({
          status: 'pending',
          attempt_count: 0,
          error_message: null,
          processed_at: null
        })
        .eq('id', deliveryId);

      // Reprocess
      const result = await this.processWebhook(
        delivery.webhook_id,
        delivery.event_type,
        delivery.payload
      );

      observabilityService.trackAdmin('webhook_replayed', deliveryId, {
        success: result.success,
        eventType: delivery.event_type
      });

      return result;

    } catch (error) {
      console.error('Webhook replay failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =============================================================
  // WEBHOOK HANDLERS
  // =============================================================

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(payload, webhookId) {
    const paymentIntentId = payload.id;
    
    // Update order status
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        payment_confirmed_at: new Date().toISOString(),
        webhook_id: webhookId
      })
      .eq('payment_intent_id', paymentIntentId);

    if (error) {
      throw new Error(`Failed to update order: ${error.message}`);
    }

    observabilityService.trackPayment('succeeded', paymentIntentId, {
      amount: payload.amount,
      currency: payload.currency
    });
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(payload, webhookId) {
    const paymentIntentId = payload.id;
    
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'failed',
        payment_failed_at: new Date().toISOString(),
        failure_reason: payload.last_payment_error?.message,
        webhook_id: webhookId
      })
      .eq('payment_intent_id', paymentIntentId);

    if (error) {
      throw new Error(`Failed to update failed order: ${error.message}`);
    }

    observabilityService.trackPayment('failed', paymentIntentId, {
      amount: payload.amount,
      currency: payload.currency,
      reason: payload.last_payment_error?.message
    });
  }

  /**
   * Handle Stripe account updates
   */
  async handleAccountUpdated(payload, webhookId) {
    const accountId = payload.id;
    
    const { error } = await supabase
      .from('stripe_connect_accounts')
      .update({
        charges_enabled: payload.charges_enabled,
        payouts_enabled: payload.payouts_enabled,
        details_submitted: payload.details_submitted,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_account_id', accountId);

    if (error) {
      throw new Error(`Failed to update account: ${error.message}`);
    }
  }

  /**
   * Handle transfer creation
   */
  async handleTransferCreated(payload, webhookId) {
    // Handle creator payout transfers
    console.log('Transfer created:', payload.id);
  }

  /**
   * Handle giveaway ended
   */
  async handleGiveawayEnded(payload, webhookId) {
    const giveawayId = payload.giveaway_id;
    
    // Trigger winner selection process
    // This would typically call fairnessService.selectVerifiableWinner
    console.log('Giveaway ended, selecting winner:', giveawayId);
  }

  /**
   * Handle user verification
   */
  async handleUserVerified(payload, webhookId) {
    const userId = payload.user_id;
    
    // Update user verification status
    const { error } = await supabase
      .from('user_verifications')
      .update({
        verification_status: 'verified',
        verification_completed_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update user verification: ${error.message}`);
    }
  }

  /**
   * Get webhook delivery statistics
   */
  async getDeliveryStats(timeframe = '24h') {
    try {
      const timeframeHours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 24;
      const since = new Date(Date.now() - timeframeHours * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('status, event_type, created_at')
        .gte('created_at', since.toISOString());

      if (error) {
        throw error;
      }

      const stats = {
        total: data.length,
        succeeded: data.filter(d => d.status === 'succeeded').length,
        failed: data.filter(d => d.status === 'failed').length,
        pending: data.filter(d => d.status === 'pending').length,
        retrying: data.filter(d => d.status === 'retrying').length,
        byEventType: {}
      };

      // Group by event type
      data.forEach(delivery => {
        if (!stats.byEventType[delivery.event_type]) {
          stats.byEventType[delivery.event_type] = 0;
        }
        stats.byEventType[delivery.event_type]++;
      });

      stats.successRate = stats.total > 0 ? (stats.succeeded / stats.total * 100).toFixed(2) : 0;

      return { data: stats, error: null };

    } catch (error) {
      console.error('Failed to get delivery stats:', error);
      return { data: null, error };
    }
  }
}

export default new WebhookReliabilityService();
