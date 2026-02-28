import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.8.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.order_id
  const giveawayId = paymentIntent.metadata.giveaway_id
  const userId = paymentIntent.metadata.user_id
  const creatorId = paymentIntent.metadata.creator_id
  const entryCount = parseInt(paymentIntent.metadata.entry_count || '1')

  console.log(`Processing successful payment: ${paymentIntent.id}`)

  try {
    // Update order status to completed
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        stripe_charge_id: paymentIntent.latest_charge as string,
        payment_completed_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (orderError) {
      throw new Error(`Failed to update order: ${orderError.message}`)
    }

    // Get creator's Connect account
    const { data: connectAccount } = await supabase
      .from('stripe_connect_accounts')
      .select('stripe_account_id, payouts_enabled')
      .eq('user_id', creatorId)
      .single()

    // If creator has Connect account set up, transfer funds
    if (connectAccount?.stripe_account_id && connectAccount.payouts_enabled) {
      const creatorAmount = parseInt(paymentIntent.metadata.creator_amount || '0')
      
      try {
        const transfer = await stripe.transfers.create({
          amount: creatorAmount,
          currency: 'usd',
          destination: connectAccount.stripe_account_id,
          transfer_group: `giveaway_${giveawayId}`,
          metadata: {
            giveaway_id: giveawayId,
            order_id: orderId,
            creator_id: creatorId
          }
        })

        // Update order with transfer information
        await supabase
          .from('orders')
          .update({
            stripe_transfer_id: transfer.id,
            transfer_completed_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        console.log(`Transferred ${creatorAmount/100} to creator ${creatorId}`)
      } catch (transferError) {
        console.error('Transfer failed:', transferError)
        // Don't throw - payment was successful, transfer can be retried
      }
    }

    console.log(`Order ${orderId} completed successfully`)

  } catch (error) {
    console.error('Error processing payment success:', error)
    // Don't throw - we want to acknowledge receipt to Stripe
  }
          entry_count: entryCount,
          total_cost: paymentIntent.amount / 100, // Convert from cents
          status: 'active',
          payment_id: paymentId,
          payment_status: 'completed',
          entry_data: {
            ticket_numbers: Array.from({ length: entryCount }, (_, i) => i + 1),
            purchase_date: new Date().toISOString()
          }
        })

      if (entryError) {
        throw new Error(`Failed to create entries: ${entryError.message}`)
      }

      // Update giveaway sold tickets count
      const { error: giveawayError } = await supabase
        .rpc('increment_sold_tickets', {
          giveaway_id: giveawayId,
          ticket_count: entryCount
        })

      if (giveawayError) {
        console.error('Failed to update sold tickets:', giveawayError)
      }

      console.log(`Created ${entryCount} entries for user ${userId} in giveaway ${giveawayId}`)
    }

    if (paymentType === 'prize_deposit') {
      // Update giveaway prize deposit status
      const { error: giveawayError } = await supabase
        .from('giveaways')
        .update({
          prize_deposited: true,
          prize_deposit_date: new Date().toISOString()
        })
        .eq('id', giveawayId)

      if (giveawayError) {
        throw new Error(`Failed to update giveaway prize status: ${giveawayError.message}`)
      }

      console.log(`Prize deposited for giveaway ${giveawayId}`)
    }

  } catch (error) {
    console.error('Error processing payment success:', error)
    // Don't throw - we want to acknowledge receipt to Stripe
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Processing failed payment: ${paymentIntent.id}`)

  try {
    // Update payment status
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
        processed_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (paymentError) {
      console.error('Failed to update payment status:', paymentError)
    }

  } catch (error) {
    console.error('Error processing payment failure:', error)
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  console.log(`Processing account update: ${account.id}`)

  try {
    // Update creator's Stripe account status
    const { error } = await supabase
      .from('profiles')
      .update({
        stripe_account_id: account.id,
        stripe_account_enabled: account.details_submitted && account.charges_enabled,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_account_id', account.id)

    if (error) {
      console.error('Failed to update user Stripe account:', error)
    }

  } catch (error) {
    console.error('Error processing account update:', error)
  }
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  console.log(`Processing transfer: ${transfer.id}`)

  try {
    // Record the transfer in payouts table
    const { error } = await supabase
      .from('payouts')
      .update({
        stripe_transfer_id: transfer.id,
        status: 'processing',
        processed_at: new Date().toISOString()
      })
      .eq('stripe_account_id', transfer.destination)
      .eq('status', 'pending')

    if (error) {
      console.error('Failed to update payout with transfer ID:', error)
    }

  } catch (error) {
    console.error('Error processing transfer:', error)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log(`Received webhook: ${event.type}`)

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer)
        break

      case 'transfer.updated':
        // Handle transfer status updates (completed, failed, etc.)
        const transferUpdate = event.data.object as Stripe.Transfer
        await supabase
          .from('payouts')
          .update({
            status: transferUpdate.metadata.status || 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_transfer_id', transferUpdate.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
