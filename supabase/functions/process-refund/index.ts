import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.8.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      orderId,
      refundType = 'full', // 'full' or 'partial'
      refundAmount, // Required for partial refunds
      reason = 'Giveaway cancelled',
      adminUserId
    } = await req.json()

    if (!orderId || !adminUserId) {
      return new Response(
        JSON.stringify({ error: 'orderId and adminUserId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify admin permissions
    const { data: admin } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', adminUserId)
      .single()

    if (!admin?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        entries:entries!order_id(*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (order.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: 'Can only refund completed orders' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Calculate refund amount
    let finalRefundAmount: number;
    if (refundType === 'full') {
      finalRefundAmount = Math.round(order.total_amount * 100); // Convert to cents
    } else {
      if (!refundAmount || refundAmount <= 0) {
        return new Response(
          JSON.stringify({ error: 'refundAmount is required for partial refunds' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      finalRefundAmount = Math.round(refundAmount * 100); // Convert to cents
    }

    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: finalRefundAmount,
      reason: 'requested_by_customer',
      metadata: {
        order_id: orderId,
        admin_user_id: adminUserId,
        refund_reason: reason,
        refund_type: refundType
      }
    })

    // If there was a transfer to creator, create a reverse transfer
    let reverseTransfer = null;
    if (order.stripe_transfer_id && refundType === 'full') {
      try {
        // Calculate creator refund amount (their portion of the refund)
        const creatorRefundAmount = Math.round(
          (order.creator_amount / order.total_amount) * finalRefundAmount
        );

        reverseTransfer = await stripe.transfers.create({
          amount: creatorRefundAmount,
          currency: order.currency,
          destination: order.stripe_account_id, // Platform account
          metadata: {
            type: 'refund_reversal',
            original_transfer_id: order.stripe_transfer_id,
            order_id: orderId,
            refund_id: refund.id
          }
        });
      } catch (transferError) {
        console.error('Failed to create reverse transfer:', transferError);
        // Continue with refund even if reverse transfer fails
      }
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: refundType === 'full' ? 'refunded' : 'partially_refunded',
        refund_amount: finalRefundAmount / 100, // Convert back to dollars
        refund_reason: reason,
        stripe_refund_id: refund.id,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to update order:', updateError);
    }

    // Revoke entries if full refund
    if (refundType === 'full' && order.entries?.length > 0) {
      const { error: entryError } = await supabase
        .from('entries')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId)

      if (entryError) {
        console.error('Failed to revoke entries:', entryError);
      }

      // Update giveaway entry count
      const { error: giveawayError } = await supabase
        .rpc('decrement_giveaway_entries', {
          giveaway_id: order.giveaway_id,
          entry_count: order.ticket_count
        })

      if (giveawayError) {
        console.error('Failed to update giveaway entry count:', giveawayError);
      }
    }

    // Create refund record for tracking
    await supabase
      .from('refunds')
      .insert({
        order_id: orderId,
        user_id: order.user_id,
        admin_user_id: adminUserId,
        refund_amount: finalRefundAmount / 100,
        refund_type: refundType,
        reason: reason,
        stripe_refund_id: refund.id,
        stripe_reverse_transfer_id: reverseTransfer?.id,
        processed_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        refund_id: refund.id,
        refund_amount: finalRefundAmount / 100,
        reverse_transfer_id: reverseTransfer?.id,
        entries_revoked: refundType === 'full' ? order.ticket_count : 0
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Refund processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
