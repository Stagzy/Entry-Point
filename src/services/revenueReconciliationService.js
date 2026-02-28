import { supabase, TABLES } from '../config/supabase';
import { paymentService } from './paymentService';

// Check if we're using real backend
const isRealBackend = process.env.EXPO_PUBLIC_SUPABASE_URL && 
                     process.env.EXPO_PUBLIC_SUPABASE_URL !== 'https://demo.supabase.co';

/**
 * Revenue Reconciliation Service
 * Handles coordination between RevenueCat entry purchases and Stripe Connect creator payouts
 */
export const revenueReconciliationService = {

  /**
   * Process creator payout after giveaway completion
   */
  async processCreatorPayout(giveawayId) {
    if (!isRealBackend) {
      // Mock payout processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        success: true,
        mock: true,
        data: {
          payout_id: 'payout_mock_' + Date.now(),
          creator_amount: 85.50,
          platform_fee: 14.50,
          total_revenue: 100.00,
          payout_status: 'completed'
        }
      };
    }

    try {
      // Get giveaway details and creator info
      const { data: giveaway, error: giveawayError } = await supabase
        .from(TABLES.GIVEAWAYS)
        .select(`
          *,
          creator:profiles!creator_id(*)
        `)
        .eq('id', giveawayId)
        .single();

      if (giveawayError || !giveaway) {
        return { success: false, error: 'Giveaway not found' };
      }

      // Calculate total revenue from RevenueCat orders for this giveaway
      const revenueCalculation = await this.calculateGiveawayRevenue(giveawayId);
      
      if (!revenueCalculation.success) {
        return { success: false, error: 'Failed to calculate revenue' };
      }

      const { totalRevenue, platformFee, creatorAmount, entryCount } = revenueCalculation.data;

      // Only process payout if there's revenue and giveaway is completed
      if (totalRevenue > 0 && giveaway.status === 'completed') {
        // Check if creator has Stripe Connect account
        const connectAccount = await this.getCreatorConnectAccount(giveaway.creator_id);
        
        if (!connectAccount.success) {
          return { success: false, error: 'Creator needs to set up payout account' };
        }

        // Process payout through Stripe Connect
        const payoutResult = await this.processStripePayout(
          connectAccount.data.stripe_account_id,
          creatorAmount,
          giveawayId
        );

        if (payoutResult.success) {
          // Record payout in database
          const recordResult = await this.recordCreatorPayout(
            giveawayId,
            giveaway.creator_id,
            totalRevenue,
            platformFee,
            creatorAmount,
            entryCount,
            payoutResult.data.transfer_id
          );

          return {
            success: true,
            data: {
              payout_id: recordResult.data?.id,
              creator_amount: creatorAmount,
              platform_fee: platformFee,
              total_revenue: totalRevenue,
              entry_count: entryCount,
              transfer_id: payoutResult.data.transfer_id,
              payout_status: 'completed'
            }
          };
        } else {
          return { success: false, error: payoutResult.error };
        }
      } else {
        return { 
          success: false, 
          error: totalRevenue === 0 ? 'No revenue to pay out' : 'Giveaway not completed'
        };
      }
    } catch (error) {
      console.error('Creator payout processing error:', error);
      return { success: false, error };
    }
  },

  /**
   * Calculate total revenue for a giveaway from RevenueCat orders
   */
  async calculateGiveawayRevenue(giveawayId) {
    if (!isRealBackend) {
      return {
        success: true,
        data: {
          totalRevenue: 100.00,
          platformFee: 14.50,
          creatorAmount: 85.50,
          entryCount: 42
        }
      };
    }

    try {
      const { data: orders, error: ordersError } = await supabase
        .from(TABLES.ORDERS)
        .select('total_amount, entry_count, currency')
        .eq('giveaway_id', giveawayId)
        .eq('status', 'completed')
        .eq('payment_method', 'revenuecat');

      if (ordersError) {
        return { success: false, error: ordersError };
      }

      // Calculate totals (assuming all in USD for now)
      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const totalEntries = orders.reduce((sum, order) => sum + order.entry_count, 0);
      
      // Platform fee calculation (15% to cover app store fees + our margin)
      const platformFeePercentage = 0.15; // 15%
      const platformFee = Math.round(totalRevenue * platformFeePercentage * 100) / 100;
      const creatorAmount = totalRevenue - platformFee;

      return {
        success: true,
        data: {
          totalRevenue,
          platformFee,
          creatorAmount,
          entryCount: totalEntries,
          orderCount: orders.length
        }
      };
    } catch (error) {
      console.error('Revenue calculation error:', error);
      return { success: false, error };
    }
  },

  /**
   * Get creator's Stripe Connect account
   */
  async getCreatorConnectAccount(creatorId) {
    if (!isRealBackend) {
      return {
        success: true,
        data: {
          stripe_account_id: 'acct_mock_creator',
          onboarding_completed: true
        }
      };
    }

    try {
      const { data: account, error } = await supabase
        .from('stripe_connect_accounts')
        .select('*')
        .eq('user_id', creatorId)
        .eq('onboarding_completed', true)
        .single();

      if (error || !account) {
        return { success: false, error: 'No valid Connect account found' };
      }

      return { success: true, data: account };
    } catch (error) {
      console.error('Get connect account error:', error);
      return { success: false, error };
    }
  },

  /**
   * Process Stripe Connect transfer to creator
   */
  async processStripePayout(stripeAccountId, amount, giveawayId) {
    if (!isRealBackend) {
      return {
        success: true,
        data: {
          transfer_id: 'tr_mock_' + Date.now(),
          amount: amount
        }
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('process-creator-payout', {
        body: {
          destination_account: stripeAccountId,
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          giveaway_id: giveawayId,
          description: `Creator payout for giveaway ${giveawayId}`
        }
      });

      if (error) {
        console.error('Stripe payout error:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Process Stripe payout error:', error);
      return { success: false, error };
    }
  },

  /**
   * Record creator payout in database
   */
  async recordCreatorPayout(giveawayId, creatorId, totalRevenue, platformFee, creatorAmount, entryCount, transferId) {
    if (!isRealBackend) {
      return {
        success: true,
        data: {
          id: 'payout_record_mock_' + Date.now()
        }
      };
    }

    try {
      const { data, error } = await supabase
        .from('creator_payouts')
        .insert({
          giveaway_id: giveawayId,
          creator_id: creatorId,
          total_revenue: totalRevenue,
          platform_fee: platformFee,
          creator_amount: creatorAmount,
          entry_count: entryCount,
          stripe_transfer_id: transferId,
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Record payout error:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Record creator payout error:', error);
      return { success: false, error };
    }
  },

  /**
   * Get payout history for a creator
   */
  async getCreatorPayoutHistory(creatorId, limit = 10) {
    if (!isRealBackend) {
      return {
        success: true,
        data: [
          {
            id: 'payout_1',
            giveaway_id: 'giveaway_1',
            total_revenue: 100.00,
            platform_fee: 15.00,
            creator_amount: 85.00,
            processed_at: new Date().toISOString(),
            status: 'completed'
          }
        ]
      };
    }

    try {
      const { data, error } = await supabase
        .from('creator_payouts')
        .select(`
          *,
          giveaway:giveaways(title, status)
        `)
        .eq('creator_id', creatorId)
        .order('processed_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get payout history error:', error);
      return { success: false, error };
    }
  },

  /**
   * Get platform revenue summary
   */
  async getPlatformRevenueSummary(startDate, endDate) {
    if (!isRealBackend) {
      return {
        success: true,
        data: {
          total_revenue: 1500.00,
          platform_fees: 225.00,
          creator_payouts: 1275.00,
          transaction_count: 150,
          active_creators: 25
        }
      };
    }

    try {
      // Get RevenueCat revenue
      const { data: orders, error: ordersError } = await supabase
        .from(TABLES.ORDERS)
        .select('total_amount, created_at')
        .eq('payment_method', 'revenuecat')
        .eq('status', 'completed')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (ordersError) {
        return { success: false, error: ordersError };
      }

      // Get creator payouts
      const { data: payouts, error: payoutsError } = await supabase
        .from('creator_payouts')
        .select('platform_fee, creator_amount, creator_id')
        .gte('processed_at', startDate)
        .lte('processed_at', endDate);

      if (payoutsError) {
        return { success: false, error: payoutsError };
      }

      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const totalPlatformFees = payouts.reduce((sum, payout) => sum + payout.platform_fee, 0);
      const totalCreatorPayouts = payouts.reduce((sum, payout) => sum + payout.creator_amount, 0);
      const uniqueCreators = new Set(payouts.map(p => p.creator_id)).size;

      return {
        success: true,
        data: {
          total_revenue: totalRevenue,
          platform_fees: totalPlatformFees,
          creator_payouts: totalCreatorPayouts,
          transaction_count: orders.length,
          active_creators: uniqueCreators
        }
      };
    } catch (error) {
      console.error('Platform revenue summary error:', error);
      return { success: false, error };
    }
  }
};
