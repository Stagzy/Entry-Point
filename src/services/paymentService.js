import { supabase, TABLES } from '../config/supabase';
import { revenueCatService } from './revenueCatService';

// Check if we're using real backend (both Supabase and Stripe configured)
const isRealBackend = process.env.EXPO_PUBLIC_SUPABASE_URL && 
                     process.env.EXPO_PUBLIC_SUPABASE_URL !== 'https://demo.supabase.co' &&
                     process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
                     process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY !== 'pk_test_your_stripe_publishable_key_here';

/**
 * Payment Service for handling hybrid payment architecture:
 * - RevenueCat (StoreKit/Play Billing) for entry purchases
 * - Stripe Connect for creator payouts
 */
export const paymentService = {
  
  /**
   * Initialize payment services
   */
  async initialize(userId) {
    try {
      // Initialize RevenueCat for in-app purchases
      const revenueCatResult = await revenueCatService.initialize(userId);
      
      return {
        success: true,
        revenueCat: revenueCatResult,
      };
    } catch (error) {
      console.error('Payment service initialization error:', error);
      return { success: false, error };
    }
  },

  /**
   * Get available entry packages for purchase
   */
  async getEntryPackages() {
    try {
      const result = await revenueCatService.getAvailableProducts();
      
      if (result.success) {
        // Map RevenueCat products to our entry packages format
        const packages = result.products.map(product => ({
          id: product.identifier,
          entryCount: revenueCatService.getEntryCountForProduct(product.identifier),
          price: product.price,
          priceString: product.priceString,
          currencyCode: product.currencyCode,
          title: product.title,
          description: product.description,
          savings: this.calculateSavings(product.identifier, product.price),
        }));

        return { success: true, packages };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error fetching entry packages:', error);
      return { success: false, error };
    }
  },

  /**
   * Purchase entry package through RevenueCat
   */
  async purchaseEntryPackage(packageId, giveawayId, userId) {
    try {
      // Purchase through RevenueCat
      const purchaseResult = await revenueCatService.purchaseProduct(packageId, giveawayId);
      
      if (purchaseResult.success) {
        // Record the purchase in our database
        const orderResult = await this.createEntryOrder(
          giveawayId,
          userId,
          purchaseResult.purchaseInfo
        );

        if (orderResult.success) {
          // Add entries to the giveaway
          const entriesResult = await this.addGiveawayEntries(
            giveawayId,
            userId,
            purchaseResult.purchaseInfo.entryCount,
            orderResult.data.id
          );

          if (entriesResult.success) {
            return {
              success: true,
              data: {
                orderId: orderResult.data.id,
                entryCount: purchaseResult.purchaseInfo.entryCount,
                transactionId: purchaseResult.purchaseInfo.transactionId,
                entries: entriesResult.data,
              },
            };
          } else {
            // TODO: Handle entry creation failure - might need to refund
            return { success: false, error: 'Failed to create entries' };
          }
        } else {
          return { success: false, error: 'Failed to record order' };
        }
      } else {
        return { success: false, error: purchaseResult.error };
      }
    } catch (error) {
      console.error('Entry package purchase error:', error);
      return { success: false, error };
    }
  },

  /**
   * Create order record for RevenueCat purchase
   */
  async createEntryOrder(giveawayId, userId, purchaseInfo) {
    if (!isRealBackend) {
      // Mock order creation
      return {
        success: true,
        data: {
          id: 'order_mock_' + Date.now(),
          user_id: userId,
          giveaway_id: giveawayId,
          entry_count: purchaseInfo.entryCount,
          total_amount: purchaseInfo.price,
          currency: purchaseInfo.currencyCode,
          transaction_id: purchaseInfo.transactionId,
          payment_method: 'revenuecat',
          status: 'completed'
        }
      };
    }

    try {
      const { data: orderData, error: orderError } = await supabase
        .from(TABLES.ORDERS)
        .insert({
          user_id: userId,
          giveaway_id: giveawayId,
          entry_count: purchaseInfo.entryCount,
          total_amount: purchaseInfo.price,
          currency: purchaseInfo.currencyCode,
          transaction_id: purchaseInfo.transactionId,
          payment_method: 'revenuecat',
          status: 'completed',
          created_at: new Date().toISOString(),
          metadata: {
            productId: purchaseInfo.productId,
            revenueCatUserId: purchaseInfo.revenueCatUserId,
            purchaseDate: purchaseInfo.purchaseDate,
          }
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        return { success: false, error: orderError };
      }

      return { success: true, data: orderData };
    } catch (error) {
      console.error('Create entry order error:', error);
      return { success: false, error };
    }
  },

  /**
   * Add entries to giveaway after successful purchase
   */
  async addGiveawayEntries(giveawayId, userId, entryCount, orderId) {
    if (!isRealBackend) {
      // Mock entry creation
      const entries = Array.from({ length: entryCount }, (_, i) => ({
        id: `entry_mock_${Date.now()}_${i}`,
        user_id: userId,
        giveaway_id: giveawayId,
        order_id: orderId,
        entry_number: i + 1,
        created_at: new Date().toISOString()
      }));

      return { success: true, data: entries };
    }

    try {
      // Create multiple entries
      const entries = Array.from({ length: entryCount }, (_, i) => ({
        user_id: userId,
        giveaway_id: giveawayId,
        order_id: orderId,
        created_at: new Date().toISOString()
      }));

      const { data: entryData, error: entryError } = await supabase
        .from(TABLES.GIVEAWAY_ENTRIES)
        .insert(entries)
        .select();

      if (entryError) {
        console.error('Entry creation error:', entryError);
        return { success: false, error: entryError };
      }

      return { success: true, data: entryData };
    } catch (error) {
      console.error('Add giveaway entries error:', error);
      return { success: false, error };
    }
  },

  /**
   * Calculate savings percentage for entry packages
   */
  calculateSavings(productId, price) {
    const singleEntryPrice = 0.99; // Base price for single entry
    const entryCount = revenueCatService.getEntryCountForProduct(productId);
    
    if (entryCount === 1) return 0;
    
    const regularPrice = entryCount * singleEntryPrice;
    const savings = ((regularPrice - price) / regularPrice) * 100;
    
    return Math.round(savings);
  },
  
  /**
   * Create Stripe Connect account for creator
   */
  async createConnectAccount(userId, email, country = 'US') {
    if (!isRealBackend) {
      // Mock connect account creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        data: {
          account_id: 'acct_mock_' + Date.now(),
          onboarding_url: 'https://connect.stripe.com/setup/mock',
          onboarding_completed: false
        },
        error: null
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { user_id: userId, email, country }
      });

      if (error) {
        console.error('Connect account creation error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Connect account service error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get Connect account status
   */
  async getConnectAccountStatus(userId) {
    if (!isRealBackend) {
      return {
        data: {
          onboarding_completed: true,
          payouts_enabled: true,
          charges_enabled: true
        },
        error: null
      };
    }

    try {
      const { data, error } = await supabase
        .from('stripe_connect_accounts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is ok
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Connect account status error:', error);
      return { data: null, error };
    }
  },

  /**
   * Create a payment intent for giveaway entry with Connect support
   */
  async createPaymentIntent(giveawayId, userId, ticketCount, amount, creatorId) {
    if (!isRealBackend) {
      // Mock payment for demo - simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        data: {
          clientSecret: 'pi_mock_client_secret_' + Date.now(),
          paymentIntentId: 'pi_mock_' + Date.now(),
          amount: amount * 100, // Convert to cents
          platformFee: Math.round(amount * 0.05 * 100), // 5% platform fee
          creatorAmount: Math.round(amount * 0.95 * 100), // 95% to creator
        },
        error: null
      };
    }

    try {
      // Generate idempotency key for this specific payment attempt
      const idempotencyKey = `${userId}_${giveawayId}_${ticketCount}_${Date.now()}`;
      
      // Calculate platform fee (5% default)
      const platformFeePercentage = 0.05; // 5%
      const subtotal = amount;
      const platformFee = Math.round(subtotal * platformFeePercentage * 100) / 100;
      const creatorAmount = subtotal - platformFee;

      // Call Supabase Edge Function to create Stripe payment intent with Connect
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          giveawayId,
          userId,
          creatorId,
          ticketCount,
          amount: Math.round(subtotal * 100), // Convert to cents
          platformFee: Math.round(platformFee * 100), // Convert to cents
          creatorAmount: Math.round(creatorAmount * 100), // Convert to cents
          currency: 'usd',
          idempotencyKey: idempotencyKey
        }
      });

      if (error) {
        console.error('Payment intent creation error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Payment service error:', error);
      return { data: null, error };
    }
  },

  /**
   * Process refund (admin only)
   */
  async processRefund(orderId, refundType = 'full', refundAmount = null, reason = 'Giveaway cancelled', adminUserId) {
    if (!isRealBackend) {
      // Mock refund
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        data: {
          refund_id: 'mock_refund_' + Date.now(),
          refund_amount: refundAmount || 10.00,
          entries_revoked: refundType === 'full' ? 1 : 0
        },
        error: null
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          orderId,
          refundType,
          refundAmount,
          reason,
          adminUserId
        }
      });

      if (error) {
        console.error('Refund processing error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Refund service error:', error);
      return { data: null, error };
    }
  },

  /**
   * Generate receipt for completed order
   */
  async generateReceipt(orderId) {
    if (!isRealBackend) {
      // Mock receipt
      return {
        data: {
          receipt: {
            id: 'mock_receipt_' + Date.now(),
            orderNumber: orderId.substring(0, 8).toUpperCase(),
            giveaway: { title: 'Mock Giveaway' },
            purchase: { ticketCount: 1, amount: 10.00 },
            payment: { last4: '4242' }
          },
          emailSent: true
        },
        error: null
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-receipt', {
        body: { orderId }
      });

      if (error) {
        console.error('Receipt generation error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Receipt service error:', error);
      return { data: null, error };
    }
  },

  /**
   * Create order record and handle platform fees
   */
  async createOrder(giveawayId, userId, creatorId, ticketCount, ticketPrice, paymentIntentId) {
    if (!isRealBackend) {
      // Mock order creation
      const subtotal = ticketCount * ticketPrice;
      const platformFee = Math.round(subtotal * 0.05 * 100) / 100;
      const creatorAmount = subtotal - platformFee;

      return {
        data: {
          id: 'order_mock_' + Date.now(),
          user_id: userId,
          giveaway_id: giveawayId,
          creator_id: creatorId,
          ticket_count: ticketCount,
          ticket_price: ticketPrice,
          subtotal: subtotal,
          platform_fee: platformFee,
          creator_amount: creatorAmount,
          total_amount: subtotal,
          status: 'pending'
        },
        error: null
      };
    }

    try {
      const subtotal = ticketCount * ticketPrice;
      const platformFee = Math.round(subtotal * 0.05 * 100) / 100; // 5% platform fee
      const creatorAmount = subtotal - platformFee;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          giveaway_id: giveawayId,
          creator_id: creatorId,
          ticket_count: ticketCount,
          ticket_price: ticketPrice,
          subtotal: subtotal,
          platform_fee: platformFee,
          creator_amount: creatorAmount,
          total_amount: subtotal,
          stripe_payment_intent_id: paymentIntentId,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        return { data: null, error: orderError };
      }

      return { data: orderData, error: null };
    } catch (error) {
      console.error('Order service error:', error);
      return { data: null, error };
    }
  },

  /**
   * Create entry record after successful payment
   */
  async createEntryAfterPayment(giveawayId, userId, ticketCount, paymentIntentId, amount) {
    if (!isRealBackend) {
      // Mock entry creation
      return {
        data: {
          id: 'entry_mock_' + Date.now(),
          giveaway_id: giveawayId,
          user_id: userId,
          ticket_count: ticketCount,
          total_cost: amount,
          payment_id: paymentIntentId,
          payment_status: 'completed'
        },
        error: null
      };
    }

    try {
      // Create entry record
      const { data: entryData, error: entryError } = await supabase
        .from(TABLES.ENTRIES)
        .insert({
          giveaway_id: giveawayId,
          user_id: userId,
          ticket_count: ticketCount,
          total_cost: amount,
          payment_id: paymentIntentId,
          payment_status: 'completed'
        })
        .select()
        .single();

      if (entryError) {
        console.error('Entry creation error:', entryError);
        return { data: null, error: entryError };
      }

      // Update giveaway sold tickets count
      const { error: giveawayUpdateError } = await supabase
        .from(TABLES.GIVEAWAYS)
        .update({
          sold_tickets: supabase.raw('sold_tickets + ?', [ticketCount])
        })
        .eq('id', giveawayId);

      if (giveawayUpdateError) {
        console.error('Giveaway update error:', giveawayUpdateError);
        // Don't fail the whole operation for this
      }

      return { data: entryData, error: null };
    } catch (error) {
      console.error('Entry creation error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get user's payment history
   */
  async getUserPayments(userId) {
    if (!isRealBackend) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.ENTRIES)
        .select(`
          *,
          giveaway:giveaways(
            id,
            title,
            prize,
            image_url,
            status,
            end_date
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Get user payments error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get creator's earnings
   */
  async getCreatorEarnings(creatorId) {
    if (!isRealBackend) {
      return { data: { total: 0, entries: [] }, error: null };
    }

    try {
      // Get all entries for creator's giveaways
      const { data, error } = await supabase
        .from('entries')
        .select(`
          *,
          giveaway:giveaways!inner(
            id,
            title,
            creator_id
          )
        `)
        .eq('giveaway.creator_id', creatorId)
        .eq('payment_status', 'completed');

      if (error) {
        console.error('Get creator earnings error:', error);
        return { data: null, error };
      }

      // Calculate total earnings (minus platform fee)
      const totalEarnings = data.reduce((sum, entry) => {
        const platformFee = entry.total_cost * 0.1; // 10% platform fee
        return sum + (entry.total_cost - platformFee);
      }, 0);

      return {
        data: {
          total: totalEarnings,
          entries: data,
          entryCount: data.length
        },
        error: null
      };
    } catch (error) {
      console.error('Get creator earnings error:', error);
      return { data: null, error };
    }
  },

  /**
   * Process refund for cancelled giveaway
   */
  async processRefund(entryId, reason = 'Giveaway cancelled') {
    if (!isRealBackend) {
      return { data: { refunded: true }, error: null };
    }

    try {
      // Get entry details
      const { data: entry, error: entryError } = await supabase
        .from(TABLES.ENTRIES)
        .select('*')
        .eq('id', entryId)
        .single();

      if (entryError || !entry) {
        return { data: null, error: entryError || { message: 'Entry not found' } };
      }

      // Call Supabase Edge Function to process refund
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          paymentIntentId: entry.payment_id,
          amount: Math.round(entry.total_cost * 100), // Convert to cents
          reason
        }
      });

      if (error) {
        return { data: null, error };
      }

      // Update entry status
      const { error: updateError } = await supabase
        .from(TABLES.ENTRIES)
        .update({ payment_status: 'refunded' })
        .eq('id', entryId);

      if (updateError) {
        console.error('Entry update error:', updateError);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Refund processing error:', error);
      return { data: null, error };
    }
  },

  /**
   * Payment Methods Management
   */
  
  /**
   * Get user's saved payment methods
   */
  async getUserPaymentMethods(userId) {
    if (!isRealBackend) {
      // Return empty array for now - no mock payment methods
      console.log('📱 Mock: No saved payment methods');
      return { data: [], error: null };
    }

    try {
      // In a real implementation, this would call Stripe's API to get customer's payment methods
      // For now, we'll use a placeholder table structure
      const { data, error } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      console.error('Get payment methods error:', error);
      return { data: [], error };
    }
  },

  /**
   * Add new payment method
   */
  async addPaymentMethod(userId, paymentMethodData) {
    if (!isRealBackend) {
      console.log('📱 Mock: Adding payment method');
      return { 
        data: { 
          id: 'pm_mock_' + Date.now(),
          ...paymentMethodData,
          user_id: userId 
        }, 
        error: null 
      };
    }

    try {
      // In real implementation, this would:
      // 1. Call Stripe to attach payment method to customer
      // 2. Store reference in our database
      const { data, error } = await supabase
        .from('user_payment_methods')
        .insert([{
          user_id: userId,
          stripe_payment_method_id: paymentMethodData.stripe_payment_method_id,
          type: paymentMethodData.type,
          last_four: paymentMethodData.last_four,
          brand: paymentMethodData.brand,
          exp_month: paymentMethodData.exp_month,
          exp_year: paymentMethodData.exp_year,
          is_default: paymentMethodData.is_default || false,
          is_active: true
        }])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Add payment method error:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete payment method
   */
  async deletePaymentMethod(userId, paymentMethodId) {
    if (!isRealBackend) {
      console.log('📱 Mock: Deleting payment method');
      return { data: { deleted: true }, error: null };
    }

    try {
      // In real implementation, this would:
      // 1. Detach from Stripe customer
      // 2. Mark as inactive in our database
      const { data, error } = await supabase
        .from('user_payment_methods')
        .update({ is_active: false })
        .eq('id', paymentMethodId)
        .eq('user_id', userId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Delete payment method error:', error);
      return { data: null, error };
    }
  },

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(userId, paymentMethodId) {
    if (!isRealBackend) {
      console.log('📱 Mock: Setting default payment method');
      return { data: { updated: true }, error: null };
    }

    try {
      // First, unset all other defaults
      await supabase
        .from('user_payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);

      // Then set the new default
      const { data, error } = await supabase
        .from('user_payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId)
        .eq('user_id', userId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Set default payment method error:', error);
      return { data: null, error };
    }
  }
};

export default paymentService;
