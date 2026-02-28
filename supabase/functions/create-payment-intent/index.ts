import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.8.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentIntentRequest {
  giveawayId: string
  userId: string
  amount: number
  currency?: string
  paymentType: 'entry_purchase' | 'prize_deposit'
  entryCount?: number
  metadata?: Record<string, any>
}

async function calculateFees(amount: number, giveawayId: string, supabaseClient: any) {
  // Get platform fee rate from giveaway
  const { data: giveaway } = await supabaseClient
    .from('giveaways')
    .select('platform_fee_rate')
    .eq('id', giveawayId)
    .single()

  const feeRate = giveaway?.platform_fee_rate || 0.05 // 5% default
  const platformFee = Math.max(amount * feeRate, 50) // Min $0.50
  const stripeFee = Math.round(amount * 0.029 + 30) // 2.9% + $0.30
  const netAmount = amount - platformFee - stripeFee

  return {
    platformFee,
    stripeFee,
    netAmount,
    totalFees: platformFee + stripeFee
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Parse request body for enhanced payment types
    const {
      giveawayId,
      amount,
      currency = 'usd',
      paymentType,
      entryCount = 1,
      ticketCount, // Legacy support
      totalAmount, // Legacy support
      metadata = {}
    }: PaymentIntentRequest & { ticketCount?: number; totalAmount?: number } = await req.json()

    // Legacy compatibility
    const finalAmount = amount || totalAmount
    const finalEntryCount = entryCount || ticketCount || 1
    const finalPaymentType = paymentType || 'entry_purchase'

    if (!giveawayId || !finalAmount) {
      throw new Error('Missing required parameters: giveawayId and amount')
    }

    // Verify giveaway exists and get details
    const { data: giveaway, error: giveawayError } = await supabaseClient
      .from('giveaways')
      .select('*')
      .eq('id', giveawayId)
      .single()

    if (giveawayError || !giveaway) {
      throw new Error('Giveaway not found')
    }

    // Validate giveaway status for different payment types
    if (finalPaymentType === 'entry_purchase' && giveaway.status !== 'active') {
      throw new Error('Giveaway is not active for entries')
    }

    if (finalPaymentType === 'prize_deposit' && giveaway.creator_id !== user.id) {
      throw new Error('Only giveaway creator can deposit prize money')
    }

    // Check ticket availability for entry purchases
    if (finalPaymentType === 'entry_purchase') {
      const remainingTickets = giveaway.total_tickets - (giveaway.sold_tickets || 0)
      if (finalEntryCount > remainingTickets) {
        throw new Error('Not enough tickets available')
      }
    }

    // Calculate fees
    const fees = await calculateFees(finalAmount, giveawayId, supabaseClient)

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        giveaway_id: giveawayId,
        transaction_type: finalPaymentType,
        amount: finalAmount,
        currency: currency.toUpperCase(),
        platform_fee_amount: fees.platformFee,
        net_amount: fees.netAmount,
        description: finalPaymentType === 'entry_purchase' 
          ? `Purchase ${finalEntryCount} entries for giveaway`
          : 'Prize deposit for giveaway',
        payment_metadata: {
          ...metadata,
          entry_count: finalEntryCount,
          fees: fees
        }
      })
      .select()
      .single()

    if (paymentError) {
      throw new Error(`Failed to create payment record: ${paymentError.message}`)
    }

    // Create Stripe PaymentIntent
    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(finalAmount * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        payment_id: payment.id,
        giveaway_id: giveawayId,
        user_id: user.id,
        payment_type: finalPaymentType,
        entry_count: finalEntryCount.toString()
      },
      description: finalPaymentType === 'entry_purchase' 
        ? `${finalEntryCount} ticket(s) for ${giveaway.title}`
        : `Prize deposit for ${giveaway.title}`,
      receipt_email: user.email,
    }

    // For prize deposits, use Stripe Connect if creator has connected account
    if (finalPaymentType === 'prize_deposit' && giveaway.creator_stripe_account_id) {
      paymentIntentData.on_behalf_of = giveaway.creator_stripe_account_id
      paymentIntentData.transfer_data = {
        destination: giveaway.creator_stripe_account_id,
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData)

    // Update payment record with Stripe PaymentIntent ID
    await supabaseClient
      .from('payments')
      .update({ 
        stripe_payment_intent_id: paymentIntent.id,
        stripe_account_id: giveaway.creator_stripe_account_id 
      })
      .eq('id', payment.id)

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        payment_id: payment.id,
        fees: fees
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating payment intent:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
